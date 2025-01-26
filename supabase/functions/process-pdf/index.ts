import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { Document } from 'https://cdn.jsdelivr.net/npm/langchain/dist/document.js'
import { OpenAIEmbeddings } from 'https://cdn.jsdelivr.net/npm/langchain/dist/embeddings/openai.js'
import { PDFLoader } from 'https://cdn.jsdelivr.net/npm/langchain/dist/document_loaders/fs/pdf.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { document_id } = await req.json()
    console.log('Processing document:', document_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError) {
      throw new Error(`Error fetching document: ${docError.message}`)
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product_docs')
      .download(doc.file_path)

    if (downloadError) {
      throw new Error(`Error downloading file: ${downloadError.message}`)
    }

    // Load and parse PDF
    const loader = new PDFLoader(fileData)
    const pages = await loader.load()
    
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Generate embeddings for each page
    const pageEmbeddings = await Promise.all(
      pages.map(async (page) => {
        const embedding = await embeddings.embedQuery(page.pageContent)
        return {
          content: page.pageContent,
          embedding: embedding,
        }
      })
    )

    // Update document with content and embeddings
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: pageEmbeddings[0].content, // Store first page content for now
        embedding: pageEmbeddings[0].embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})