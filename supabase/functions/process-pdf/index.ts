import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as pdfjsLib from 'npm:pdfjs-dist@3.11.174/legacy/build/pdf.js'

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

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)

    console.log('Loading PDF document...')
    
    // Configure PDF.js for server environment
    if (!globalThis.pdfjsLib) {
      globalThis.pdfjsLib = pdfjsLib
    }

    // Disable worker and configure for Node.js environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    
    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    })
    
    const pdfDocument = await loadingTask.promise
    
    console.log('PDF document loaded. Number of pages:', pdfDocument.numPages)
    
    let fullText = ''
    
    // Extract text from all pages
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    console.log('Extracted text sample:', fullText.substring(0, 200) + '...')

    // Parse content for product information
    const products = []
    const lines = fullText.split('\n').filter(line => line.trim().length > 0)
    
    let currentProduct: any = {}
    
    for (const line of lines) {
      if (line.toLowerCase().includes('sku:')) {
        if (Object.keys(currentProduct).length > 0) {
          products.push(currentProduct)
          currentProduct = {}
        }
        currentProduct.sku = line.split('SKU:')[1]?.trim()
      }
      if (line.toLowerCase().includes('name:')) {
        currentProduct.name = line.split('Name:')[1]?.trim()
      }
      if (line.toLowerCase().includes('brand:')) {
        currentProduct.brand = line.split('Brand:')[1]?.trim()
      }
      if (line.toLowerCase().includes('price:')) {
        const priceStr = line.split('Price:')[1]?.trim()
        currentProduct.price = parseFloat(priceStr?.replace(/[^0-9.]/g, ''))
      }
    }

    // Add the last product if exists
    if (Object.keys(currentProduct).length > 0) {
      products.push(currentProduct)
    }

    console.log('Extracted products:', products)

    // Insert products into database if any were found
    if (products.length > 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(products.map(product => ({
          ...product,
          supplier_id: null // Set this based on your business logic
        })))

      if (insertError) {
        throw new Error(`Error inserting products: ${insertError.message}`)
      }
      console.log(`Successfully inserted ${products.length} products`)
    }

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: fullText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        productsExtracted: products.length
      }),
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