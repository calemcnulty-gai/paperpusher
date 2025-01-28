import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, initSupabaseClient } from './supabaseClient.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file_path } = await req.json()
    if (!file_path) {
      throw new Error('file_path is required')
    }

    const supabase = initSupabaseClient()

    // Get existing document record
    const { data: doc, error: fetchError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('file_path', file_path)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`)
    }

    // Update status to ensure it's pending and clear any previous errors
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'pending',
        processing_error: null,
        processing_started_at: null,
        processing_completed_at: null,
        pages_processed: 0,
        total_pages: 0
      })
      .eq('id', doc.id)

    if (updateError) {
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document queued for processing',
        document: doc 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})