import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Processing PDF request received')

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

    // Convert PDF to base64
    const buffer = await fileData.arrayBuffer()
    const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)))

    // First pass: Use GPT-4 Vision to extract text and detect images
    const firstPassResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a product information extraction specialist. Extract product name, product number, color information, and identify if there are any product images in the PDF. Return the information in a structured JSON format with keys: name, product_number, color, has_product_images (boolean)."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the product information from this document and identify if there are any product images."
              },
              {
                type: "image",
                image_url: {
                  url: `data:application/pdf;base64,${base64String}`
                }
              }
            ]
          }
        ]
      })
    })

    const firstPassData = await firstPassResponse.json()
    console.log('First pass extraction completed:', firstPassData)

    let extractedInfo
    try {
      extractedInfo = JSON.parse(firstPassData.choices[0].message.content)
    } catch (e) {
      console.error('Error parsing first pass response:', e)
      extractedInfo = {
        name: "Unknown",
        product_number: "Unknown",
        color: "Unknown",
        has_product_images: false
      }
    }

    // Second pass: If images were detected, extract them
    let imageUrl = null
    if (extractedInfo.has_product_images) {
      console.log('Product images detected, initiating image extraction')
      const imageExtractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Extract and describe the main product image from this document. Return the description in a way that could be used as a prompt for image generation."
            },
            {
              role: "user",
              content: [
                {
                  type: "image",
                  image_url: {
                    url: `data:application/pdf;base64,${base64String}`
                  }
                }
              ]
            }
          ]
        })
      })

      const imageExtractionData = await imageExtractionResponse.json()
      const imagePrompt = imageExtractionData.choices[0].message.content

      // Generate a product image using DALL-E
      console.log('Generating product image with DALL-E')
      const imageGenerationResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Professional product photo: ${imagePrompt}`,
          n: 1,
          size: "1024x1024"
        })
      })

      const imageData = await imageGenerationResponse.json()
      imageUrl = imageData.data[0].url
      console.log('Image generated:', imageUrl)
    }

    // Store the extracted information in products table
    const { data: productData, error: productError } = await supabaseClient
      .from('products')
      .upsert({
        name: extractedInfo.name,
        product_number: extractedInfo.product_number,
        color: extractedInfo.color,
        image_url: imageUrl,
        document_id: document_id,
        processing_status: 'completed',
        extracted_metadata: {
          processed_at: new Date().toISOString(),
          has_product_images: extractedInfo.has_product_images,
          raw_extraction: firstPassData.choices[0].message.content
        }
      }, {
        onConflict: 'product_number'
      })
      .select()
      .single()

    if (productError) {
      console.error('Error updating products:', productError)
      throw new Error(`Error updating products: ${productError.message}`)
    }

    // Update document with content and metadata
    const { error: docUpdateError } = await supabaseClient
      .from('document_embeddings')
      .update({
        content: JSON.stringify(extractedInfo),
        metadata: {
          processedAt: new Date().toISOString(),
          fileSize: fileData.size,
          mimeType: fileData.type,
          extractedInfo,
          productId: productData.id
        },
        product_id: productData.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (docUpdateError) {
      console.error('Error updating document:', docUpdateError)
      throw new Error(`Error updating document: ${docUpdateError.message}`)
    }

    console.log('Processing completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        extractedInfo,
        productData
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