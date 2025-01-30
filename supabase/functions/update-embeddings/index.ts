import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'
import { PineconeClient } from 'https://esm.sh/@pinecone-database/pinecone@2.0.0'

const openAiConfig = new Configuration({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})
const openai = new OpenAIApi(openAiConfig)

// Create a Supabase client using runtime environment variables
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',  // Built-in runtime variable
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''  // Built-in runtime variable
)

// Initialize Pinecone client
const pinecone = new PineconeClient()
await pinecone.init({
  apiKey: Deno.env.get('PINECONE_API_KEY') ?? '',
  environment: 'gcp-starter'
})

const indexName = Deno.env.get('PINECONE_INDEX') ?? 'paperpusher'
const index = pinecone.Index(indexName)

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.createEmbedding({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 3072
    })
    return response.data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Generate text for embedding
    const textForEmbedding = `${record.name}\n${record.description}`
    
    // Generate embedding
    const embedding = await generateEmbedding(textForEmbedding)
    
    // Update embedding in Pinecone
    await index.upsert({
      vectors: [{
        id: record.id,
        values: embedding,
        metadata: {
          name: record.name,
          description: record.description
        }
      }]
    })
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 