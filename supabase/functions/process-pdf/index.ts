/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, initSupabaseClient } from './supabaseClient.ts'
import { downloadAndConvertPDF } from './documentProcessing.ts'
import { convertPDFToImage } from './pdfProcessing.ts'
import { processImages } from './imageProcessing.ts'
import { extractProductData } from './openaiProcessing.ts'

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

    // Update status to processing
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'processing',
        processing_error: null,
        processing_started_at: new Date().toISOString(),
        processing_completed_at: null,
        pages_processed: 0,
        total_pages: 0
      })
      .eq('id', doc.id)

    if (updateError) {
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    try {
      // 1. Download and convert the PDF to Uint8Array
      console.log('Downloading PDF from storage...')
      const pdfData = await downloadAndConvertPDF(supabase, file_path)

      // 2. Convert PDF to images using PDF.co
      console.log('Converting PDF to images...')
      const imageUrls = await convertPDFToImage(pdfData)

      // 3. Process images to extract text and data
      console.log('Processing images...')
      const processedData = await processImages(imageUrls)

      // 4. Extract product data using OpenAI
      console.log('Extracting product data...')
      const productData = await extractProductData(processedData)

      // 5. Update document with success status
      await supabase
        .from('document_embeddings')
        .update({
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          content: processedData,
          metadata: {
            processed: true,
            processed_at: new Date().toISOString(),
            pages_processed: imageUrls.length,
            total_pages: imageUrls.length,
            product_data: productData
          }
        })
        .eq('id', doc.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document processed successfully',
          document: doc 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (processingError) {
      // Update document with error status
      await supabase
        .from('document_embeddings')
        .update({
          processing_status: 'failed',
          processing_completed_at: new Date().toISOString(),
          processing_error: processingError instanceof Error ? processingError.message : 'Unknown error'
        })
        .eq('id', doc.id)

      throw processingError
    }

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