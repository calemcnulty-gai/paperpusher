import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Received request:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      headers: corsHeaders
    })
  }

  try {
    const { document_id } = await req.json()
    console.log('Processing document:', document_id)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get document record
    const { data: doc, error: docError } = await supabaseClient
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError) {
      console.error('Error fetching document:', docError)
      throw new Error(`Error fetching document: ${docError.message}`)
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('product_docs')
      .download(doc.file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Error downloading file: ${downloadError.message}`)
    }

    console.log('PDF downloaded successfully')
    
    // For now, we'll store the file info and update the status
    // Later we can implement more sophisticated text extraction
    const metadata = {
      processedAt: new Date().toISOString(),
      fileSize: fileData.size,
      mimeType: fileData.type,
    }

    // Update document with basic content and metadata
    const { error: updateError } = await supabaseClient
      .from('document_embeddings')
      .update({
        content: `Document processed: ${doc.filename}`,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error updating document:', updateError)
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    console.log('Processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        metadata
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})