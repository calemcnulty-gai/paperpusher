/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../process-pdf/corsHeaders.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

    // Get document details
    const { data: doc, error: fetchError } = await supabase
      .from('document_embeddings')
      .select('file_path')
      .eq('id', document_id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`)
    }

    if (!doc) {
      throw new Error('Document not found')
    }

    // Update status to queued
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'queued',
        processing_started_at: new Date().toISOString(),
        processing_completed_at: null,
        processing_error: null
      })
      .eq('id', document_id)

    // Make direct HTTP call to process-pdf function
    const functionUrl = `${supabaseUrl}/functions/v1/process-pdf`
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_path: doc.file_path })
    }).catch(error => {
      console.error('Error calling process-pdf function:', error)
    })

    // Return immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document queued for processing',
        document_id 
      }),
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