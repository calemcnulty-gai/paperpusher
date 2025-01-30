/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, initSupabaseClient } from './supabaseClient.ts'
import { downloadAndConvertPDF } from './documentProcessing.ts'
import { convertPDFToImage } from './pdfProcessing.ts'
import { storeProductImage } from './imageProcessing.ts'
import { analyzeImageWithOpenAI } from './openaiProcessing.ts'
import { createProduct } from './productProcessing.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = initSupabaseClient()
    const { file_path } = await req.json()
    
    if (!file_path) {
      throw new Error('Missing file_path in request body')
    }

    // Get document details
    const { data: doc, error: fetchError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('file_path', file_path)
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
        processing_started_at: new Date().toISOString(),
        processing_completed_at: null,
        processing_error: null
      })
      .eq('id', doc.id)

    try {
      // 1. Download and convert the PDF to Uint8Array
      console.log('Downloading PDF from storage...')
      const pdfData = await downloadAndConvertPDF(supabase, file_path)

      // 2. Convert PDF to images using PDF.co
      console.log('Converting PDF to images...')
      const imageUrls = await convertPDFToImage(pdfData)

      // 3. Process each image and extract product data
      console.log('Processing images...')
      const productData = await Promise.all(
        imageUrls.map(url => analyzeImageWithOpenAI(url, doc.filename))
      )

      // 4. Create products in database
      console.log('Creating products...')
      const products = await Promise.all(
        productData.map(async (data, index) => {
          // Skip if this is a cover page (no SKU)
          if (!data.sku) {
            console.log('Skipping page - appears to be a cover or info page')
            return null
          }
          try {
            return await createProduct(supabase, doc.id, data, imageUrls[index])
          } catch (error) {
            console.error('Failed to create product:', error)
            return null
          }
        })
      )

      // Filter out nulls and count successful creations
      const createdProducts = products.filter(p => p !== null)

      // 5. Store the processed data
      await supabase
        .from('document_embeddings')
        .update({
          processing_status: 'completed',
          processing_completed_at: new Date().toISOString(),
          content: JSON.stringify(productData),
          metadata: {
            processed: true,
            processed_at: new Date().toISOString(),
            pages_processed: imageUrls.length,
            total_pages: imageUrls.length,
            products_created: createdProducts.length,
            product_data: productData
          }
        })
        .eq('id', doc.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document processed successfully',
          document: doc,
          products_created: createdProducts.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (error) {
      // Update document status to failed
      await supabase
        .from('document_embeddings')
        .update({
          processing_status: 'failed',
          processing_completed_at: new Date().toISOString(),
          processing_error: error.message
        })
        .eq('id', doc.id)

      throw error
    }

  } catch (error) {
    console.error('Error in process-pdf function:', error)
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