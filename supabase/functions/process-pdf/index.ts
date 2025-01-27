import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { parse } from "https://deno.land/x/pdf@v0.2.0/mod.ts"

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
      console.error('Error fetching document:', docError)
      throw new Error(`Error fetching document: ${docError.message}`)
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product_docs')
      .download(doc.file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Error downloading file: ${downloadError.message}`)
    }

    console.log('PDF downloaded, starting text extraction...')
    
    // Convert Blob to ArrayBuffer and then to Uint8Array
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    console.log('Parsing PDF content...')
    const pdfData = await parse(uint8Array)
    
    console.log('PDF parsed successfully')
    const fullText = pdfData.text

    console.log('Text extracted, parsing product information...')
    
    // Extract product information from the text
    const productInfo = await extractProductInfo(fullText)
    
    // Create a new product record
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{
        name: productInfo.name || `Product from ${doc.filename}`,
        sku: `SKU-${Date.now()}`,
        color: productInfo.color,
        price: productInfo.price,
        description: productInfo.description,
      }])
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      throw new Error(`Error creating product: ${productError.message}`)
    }

    console.log('Product created:', product)

    // Update document with extracted content and link to product
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: fullText,
        product_id: product.id,
        metadata: {
          processedAt: new Date().toISOString(),
          extractedInfo: productInfo
        },
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
        product: product
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

async function extractProductInfo(text: string) {
  console.log('Extracting product info from text')
  
  // Initialize default values
  const productInfo = {
    name: '',
    color: '',
    price: null as number | null,
    description: '',
  }

  // Extract name (assume it's in the first few lines)
  const nameMatch = text.match(/Product(?:\s+)?Name(?:\s*)?:(?:\s*)?([\w\s-]+)/i) ||
                   text.match(/Name(?:\s*)?:(?:\s*)?([\w\s-]+)/i) ||
                   text.match(/Model(?:\s*)?:(?:\s*)?([\w\s-]+)/i)
  if (nameMatch) {
    productInfo.name = nameMatch[1].trim()
  }

  // Extract color
  const colorMatch = text.match(/Colou?r(?:\s*)?:(?:\s*)?([\w\s-]+)/i)
  if (colorMatch) {
    productInfo.color = colorMatch[1].trim()
  }

  // Extract price (look for currency symbols and numbers)
  const priceMatch = text.match(/(?:Price|Cost|RRP)(?:\s*)?:(?:\s*)?[$£€]?\s*(\d+(?:\.\d{2})?)/i) ||
                    text.match(/[$£€]\s*(\d+(?:\.\d{2})?)/i)
  if (priceMatch) {
    productInfo.price = parseFloat(priceMatch[1])
  }

  // Extract description (look for a description section)
  const descMatch = text.match(/Description(?:\s*)?:(?:\s*)?([\s\S]+?)(?:\n\n|\n(?=[A-Z]))/i)
  if (descMatch) {
    productInfo.description = descMatch[1].trim()
  }

  console.log('Extracted product info:', productInfo)
  return productInfo
}