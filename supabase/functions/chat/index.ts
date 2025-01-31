import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "jsr:@std/http@^0.224.0"
import { createClient } from 'npm:@supabase/supabase-js'
import { ChatOpenAI } from 'npm:@langchain/openai'
import { ChatPromptTemplate } from 'npm:@langchain/core/prompts'
import { Client } from 'npm:langsmith'
import { HumanMessage, SystemMessage, AIMessage } from 'npm:@langchain/core/messages'
import { PineconeStore } from 'npm:@langchain/pinecone'
import { Pinecone } from 'npm:@pinecone-database/pinecone'
import { ChatRequest, ChatResponse, Message, ProductContext } from './types.ts'
import { StringOutputParser } from 'npm:@langchain/core/output_parsers'
import { RunnableSequence, RunnablePassthrough } from 'npm:@langchain/core/runnables'
import { formatDocumentsAsString } from 'npm:@langchain/core/documents'
import { OpenAIEmbeddings } from 'npm:@langchain/openai'

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
  modelName: 'text-embedding-3-large',
  dimensions: 3072,
  batchSize: 512,
  stripNewLines: true
})

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY')!,
});

// Initialize LangSmith client
const client = new Client({
  apiUrl: Deno.env.get('LANGSMITH_ENDPOINT'),
  apiKey: Deno.env.get('LANGSMITH_API_KEY'),
})

// Initialize chat model
console.log('Initializing ChatOpenAI...')
const chatModel = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  streaming: true,
  openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
  configuration: {
    baseOptions: {
      adapter: 'fetch'
    }
  }
})
console.log('ChatOpenAI initialized')

// Initialize both vector stores
const productIndex = pinecone.Index(Deno.env.get('PINECONE_INDEX')!);
const productVectorStore = await PineconeStore.fromExistingIndex(
  embeddings,
  {
    pineconeIndex: productIndex,
    textKey: 'text',
    metadataKeys: ['name', 'sku', 'description', 'price', 'category']
  }
);

const productIndex2 = pinecone.Index(Deno.env.get('PINECONE_INDEX_TWO')!);
const productVectorStore2 = await PineconeStore.fromExistingIndex(
  embeddings,
  {
    pineconeIndex: productIndex2,
    textKey: 'text',
    metadataKeys: ['name', 'sku', 'description', 'price', 'category']
  }
);

// Create retrievers for both stores
const retriever1 = productVectorStore.asRetriever({ k: 3 });
const retriever2 = productVectorStore2.asRetriever({ k: 3 });

// Create the RAG prompt
const TEMPLATE = `You are a knowledgeable fashion retail assistant specializing in shoes and accessories.
You help customers find products and understand their features, materials, and styles.

Use the following product information to answer the question. If you don't know the answer, just say that 
you don't know - don't try to make up an answer.

When discussing products:
- Always include SKU and price if available
- Format prices as currency with 2 decimal places
- Mention materials and colors when relevant
- If multiple similar products exist, help compare them

Available product information:
{context}

Current conversation:
{chat_history}

Human question: {question}

`;

// Create the RAG chain
const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);

// Create the RAG chain
const ragChain = RunnableSequence.from([
  {
    context: async (input: { question: string; chat_history: string }) => {
      // Search both indexes
      const [docs1, docs2] = await Promise.all([
        retriever1.getRelevantDocuments(input.question),
        retriever2.getRelevantDocuments(input.question)
      ]);

      // Combine and deduplicate results by SKU
      const seenSkus = new Set();
      const allDocs = [...docs1, ...docs2].filter(doc => {
        if (!doc.metadata.sku) return true;
        if (seenSkus.has(doc.metadata.sku)) return false;
        seenSkus.add(doc.metadata.sku);
        return true;
      });

      // Format documents with metadata
      return allDocs.map(doc => {
        const meta = doc.metadata;
        return `Product: ${meta.name || 'Unknown'}
SKU: ${meta.sku || 'N/A'}
Price: ${meta.price ? `$${Number(meta.price).toFixed(2)}` : 'N/A'}
Category: ${meta.category || 'N/A'}
Description: ${meta.description || doc.pageContent || 'No description available'}
---`;
      }).join('\n\n');
    },
    chat_history: (input: { question: string; chat_history: string }) => input.chat_history,
    question: (input: { question: string; chat_history: string }) => input.question,
  },
  prompt,
  chatModel,
  new StringOutputParser(),
]);

async function formatChatHistory(messages: Message[]): Promise<string> {
  return messages.map(msg => 
    `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
  ).join('\n');
}

async function handleChatRequest(req: Request) {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Request body:', body)
    
    const messages = body.messages
    if (!Array.isArray(messages)) {
      throw new Error('Invalid request body: expected messages to be an array')
    }
    
    const currentMessage = messages[messages.length - 1];
    const previousMessages = messages.slice(0, -1);
    
    // Call RAG chain without streaming
    const response = await ragChain.invoke({
      question: currentMessage.content,
      chat_history: await formatChatHistory(previousMessages)
    });

    return new Response(
      JSON.stringify({ content: response }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('Error in request handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}

console.log('Starting chat function...')
serve(handleChatRequest)