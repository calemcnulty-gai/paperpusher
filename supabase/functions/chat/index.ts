import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@2.0.0'
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai@0.0.14'
import { OpenAIEmbeddings } from 'https://esm.sh/@langchain/openai@0.0.14'
import { HumanMessage, SystemMessage, AIMessage } from 'https://esm.sh/@langchain/core@0.1.32/messages'
import { ChatRequest, ChatResponse, Message, ProductContext } from './types.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize clients
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY') ?? ''
})

const chatModel = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  streaming: true,
  openAIApiKey: Deno.env.get('OPENAI_API_KEY')
})

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: Deno.env.get('OPENAI_API_KEY')
})

async function getProductContext(productId: string): Promise<ProductContext | null> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !data) {
    console.error('Error fetching product:', error)
    return null
  }

  return data as ProductContext
}

async function getRelevantContext(query: string, productId: string): Promise<string> {
  // Get embeddings for the query
  const queryEmbedding = await embeddings.embedQuery(query)
  
  // Get relevant context from Pinecone
  const index = pinecone.index(Deno.env.get('PINECONE_INDEX') ?? '')
  const queryResponse = await index.query({
    vector: queryEmbedding,
    filter: { productId },
    topK: 3,
    includeMetadata: true
  })

  // Combine the contexts
  return queryResponse.matches
    .map(match => match.metadata?.text as string)
    .filter(Boolean)
    .join('\n\n')
}

function convertToLangChainMessages(messages: Message[], systemPrompt: string) {
  const result = [new SystemMessage(systemPrompt)]
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push(new HumanMessage(msg.content))
    } else {
      result.push(new AIMessage(msg.content))
    }
  }
  
  return result
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, productId } = await req.json() as ChatRequest
    
    // Get product context if productId is provided
    const productContext = productId ? await getProductContext(productId) : null
    
    // Get relevant context from vector store
    const relevantContext = productId && messages.length > 0 
      ? await getRelevantContext(messages[messages.length - 1].content, productId)
      : ''
    
    // Construct system prompt
    let systemPrompt = `You are a helpful AI assistant.`
    if (productContext) {
      systemPrompt += `\n\nYou are helping with questions about the following product:\n${JSON.stringify(productContext, null, 2)}`
    }
    if (relevantContext) {
      systemPrompt += `\n\nHere is some relevant context from the product documentation:\n${relevantContext}`
    }
    
    // Convert messages to LangChain format
    const langChainMessages = convertToLangChainMessages(messages, systemPrompt)
    
    // Create streaming response
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()
    
    // Call chat model with streaming
    chatModel.call(langChainMessages, {
      callbacks: [{
        handleLLMNewToken: async (token: string) => {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`))
        },
        handleLLMEnd: async () => {
          await writer.write(encoder.encode('data: [DONE]\n\n'))
          await writer.close()
        },
        handleLLMError: async (error: Error) => {
          console.error('LLM error:', error)
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
          await writer.close()
        }
      }]
    })
    
    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})