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

    // Use OpenAI's GPT-4 Vision to extract information from the PDF
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: "You are a product information extraction specialist. Extract product name, product number, and color information from the image. Return the information in a structured JSON format with keys: name, product_number, color."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the product information from this image and return it in JSON format."
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

    const aiData = await openAIResponse.json()
    console.log('OpenAI response:', aiData)

    let extractedInfo
    try {
      extractedInfo = JSON.parse(aiData.choices[0].message.content)
    } catch (e) {
      console.error('Error parsing OpenAI response:', e)
      extractedInfo = {
        name: "Unknown",
        product_number: "Unknown",
        color: "Unknown"
      }
    }

    // Store the extracted information
    const { error: updateError } = await supabaseClient
      .from('products')
      .upsert({
        name: extractedInfo.name,
        sku: extractedInfo.product_number,
        color: extractedInfo.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sku'
      })

    if (updateError) {
      console.error('Error updating products:', updateError)
      throw new Error(`Error updating products: ${updateError.message}`)
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
          extractedInfo
        },
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
        extractedInfo
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