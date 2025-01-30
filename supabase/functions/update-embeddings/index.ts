import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@2.0.0'

// Define the expected record structure
interface Record {
  id: string
  name: string
  description: string
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

// Create a Supabase client using runtime environment variables
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',  // Built-in runtime variable
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''  // Built-in runtime variable
)

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY') ?? ''
})

// Get the index
const indexName = Deno.env.get('PINECONE_INDEX') ?? 'paperpusher'
const index = pinecone.index(indexName)

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

// Validate the record structure
function validateRecord(record: any): record is Record {
  return (
    typeof record === 'object' &&
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.description === 'string'
  )
}

serve(async (req) => {
  try {
    const { record } = await req.json()
    
    // Validate the record
    if (!validateRecord(record)) {
      throw new Error('Invalid record structure')
    }
    
    // Generate text for embedding
    const textForEmbedding = `${record.name}\n${record.description}`
    
    // Generate embedding
    const embedding = await generateEmbedding(textForEmbedding)
    
    // Update embedding in Pinecone
    await index.upsert([{
      id: record.id,
      values: embedding,
      metadata: {
        name: record.name,
        description: record.description
      }
    }])
    
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