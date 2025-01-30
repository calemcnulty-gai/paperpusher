import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@2.0.0'
import { ChatOpenAI } from 'https://esm.sh/@langchain/openai@0.0.14'
import { OpenAIEmbeddings } from 'https://esm.sh/@langchain/openai@0.0.14'
import { HumanMessage, SystemMessage, AIMessage } from 'https://esm.sh/@langchain/core@0.1.32/messages'
import { traceable } from 'https://esm.sh/langsmith@0.1.21/traceable'
import { ChatRequest, ChatResponse, Message, ProductContext } from './types.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': '*'
}

// Initialize clients
console.log('Initializing OpenAI client...')
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})
console.log('OpenAI client initialized')

console.log('Initializing Pinecone client...')
const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY') ?? ''
})
console.log('Pinecone client initialized')

console.log('Initializing ChatOpenAI...')
const chatModel = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  streaming: true,
  openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
  configuration: {
    baseOptions: {
      adapter: 'fetch'  // Use fetch adapter to avoid Node.js dependencies
    }
  }
})
console.log('ChatOpenAI initialized')

console.log('Initializing OpenAI Embeddings...')
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
  configuration: {
    baseOptions: {
      adapter: 'fetch'  // Use fetch adapter to avoid Node.js dependencies
    }
  }
})
console.log('OpenAI Embeddings initialized')

const getProductContext = traceable(async function getProductContext(productId: string): Promise<ProductContext | null> {
  console.log(`Getting product context for productId: ${productId}`)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  console.log('Supabase client initialized')

  console.log('Querying products table...')
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  if (!data) {
    console.log('No product found')
    return null
  }

  console.log('Product found:', data)
  return data as ProductContext
})

const getRelevantContext = traceable(async function getRelevantContext(query: string, productId: string): Promise<string> {
  console.log(`Getting relevant context for query: "${query}" and productId: ${productId}`)
  
  console.log('Generating query embedding...')
  const queryEmbedding = await embeddings.embedQuery(query)
  console.log('Query embedding generated')
  
  console.log('Querying Pinecone...')
  const index = pinecone.index(Deno.env.get('PINECONE_INDEX') ?? '')
  const queryResponse = await index.query({
    vector: queryEmbedding,
    filter: { productId },
    topK: 3,
    includeMetadata: true
  })
  console.log('Pinecone response:', queryResponse)

  const contexts = queryResponse.matches
    .map(match => match.metadata?.text as string)
    .filter(Boolean)

  console.log('Found contexts:', contexts)
  return contexts.join('\n\n')
})

const convertToLangChainMessages = traceable(function convertToLangChainMessages(messages: Message[], systemPrompt: string) {
  console.log('Converting messages to LangChain format')
  console.log('System prompt:', systemPrompt)
  console.log('Input messages:', messages)
  
  const result = [new SystemMessage(systemPrompt)]
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push(new HumanMessage(msg.content))
    } else {
      result.push(new AIMessage(msg.content))
    }
  }
  
  console.log('Converted messages:', result)
  return result
})

const handleChatRequest = traceable(async function handleChatRequest(req: Request) {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  // Verify auth header
  const authHeader = req.headers.get('authorization')
  const apiKey = req.headers.get('apikey')
  console.log('Auth header:', authHeader)
  console.log('API key:', apiKey)

  if (!authHeader || !apiKey) {
    console.error('Missing authorization header or API key')
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const body = await req.json()
    console.log('Request body:', body)
    
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Invalid request body: messages must be an array')
    }
    
    const { messages } = body as ChatRequest
    
    // Construct system prompt - keeping it simple for general chat
    const systemPrompt = `You are a helpful AI assistant. You help users understand and work with their data and documents.`
    console.log('System prompt:', systemPrompt)
    
    // Convert messages to LangChain format
    const langChainMessages = convertToLangChainMessages(messages, systemPrompt)
    
    // Create streaming response
    console.log('Creating streaming response...')
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()
    
    // Call chat model with streaming
    console.log('Calling chat model...')
    chatModel.call(langChainMessages, {
      callbacks: [{
        handleLLMNewToken: async (token: string) => {
          console.log('New token:', token)
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: token })}\n\n`))
        },
        handleLLMEnd: async () => {
          console.log('LLM stream ended')
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
    
    console.log('Returning streaming response')
    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
    
  } catch (error) {
    console.error('Error in request handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

Deno.serve(async (req) => {
  return await handleChatRequest(req)
})