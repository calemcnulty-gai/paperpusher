import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../process-pdf/corsHeaders.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const processDocument = async (supabase: any, documentId: string) => {
  console.log('Processing document:', documentId)
  
  try {
    // Get document details
    const { data: doc, error: fetchError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`)
    }

    if (!doc) {
      throw new Error('Document not found')
    }

    // Update status to processing
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', documentId)

    // Call the main processing function
    const { error: processingError } = await supabase.functions.invoke('process-pdf', {
      body: { file_path: doc.file_path }
    })

    if (processingError) {
      throw processingError
    }

    // Update final status
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    return { success: true }

  } catch (error) {
    console.error('Error processing document:', error)
    
    // Update error status
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'failed',
        processing_completed_at: new Date().toISOString(),
        processing_error: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', documentId)

    throw error
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { document_id } = await req.json()
    
    if (!document_id) {
      throw new Error('Missing document_id in request body')
    }

    const result = await processDocument(supabase, document_id)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in process-pdf-queue function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})