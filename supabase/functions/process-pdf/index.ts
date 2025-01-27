import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { PdfReader } from "https://deno.land/x/pdf2text@0.1.1/mod.ts"

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

    // Extract text content from PDF
    console.log('Extracting text from PDF...')
    const reader = new PdfReader()
    const pdfContent = await reader.readPdf(new Uint8Array(arrayBuffer))
    console.log('Extracted content:', pdfContent.substring(0, 200) + '...')

    // Parse content for product information
    // This is a basic example - you might want to enhance this based on your PDF structure
    const lines = pdfContent.split('\n').filter(line => line.trim().length > 0)
    
    // Extract potential product information
    const products = []
    let currentProduct = {}
    
    for (const line of lines) {
      // Example parsing logic - adjust based on your PDF structure
      if (line.includes('SKU:')) {
        if (Object.keys(currentProduct).length > 0) {
          products.push(currentProduct)
          currentProduct = {}
        }
        currentProduct.sku = line.split('SKU:')[1].trim()
      }
      if (line.includes('Name:')) {
        currentProduct.name = line.split('Name:')[1].trim()
      }
      if (line.includes('Brand:')) {
        currentProduct.brand = line.split('Brand:')[1].trim()
      }
      if (line.includes('Price:')) {
        const priceStr = line.split('Price:')[1].trim()
        currentProduct.price = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
      }
      // Add more parsing logic as needed
    }

    // Add the last product if exists
    if (Object.keys(currentProduct).length > 0) {
      products.push(currentProduct)
    }

    console.log('Extracted products:', products)

    // Insert products into database
    if (products.length > 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(products)

      if (insertError) {
        throw new Error(`Error inserting products: ${insertError.message}`)
      }
      console.log(`Successfully inserted ${products.length} products`)
    }

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: pdfContent,
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