import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { decode as base64Decode } from "https://deno.land/std@0.208.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { document_id } = await req.json()
    console.log('Processing document:', document_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      console.error('Document not found:', docError?.message)
      throw new Error(`Document not found: ${docError?.message}`)
    }

    console.log('Retrieved document:', document.filename)

    // Get the PDF file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('product_docs')
      .download(document.file_path)

    if (fileError || !fileData) {
      console.error('Failed to download file:', fileError?.message)
      throw new Error(`Failed to download file: ${fileError?.message}`)
    }

    console.log('Downloaded PDF file successfully')

    // Convert PDF to PNG using PDF.co API
    const pdfData = await fileData.arrayBuffer()
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)))

    console.log('Converting PDF to PNG...')
    const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('PDF_CO_API_KEY')!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Pdf,
        pages: "1",  // Convert only first page
        async: false
      })
    })

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      console.error('PDF.co API Error:', errorText)
      throw new Error(`PDF conversion failed: ${errorText}`)
    }

    const pdfResult = await pdfResponse.json()
    console.log('PDF converted to image successfully')

    if (!pdfResult.urls || !pdfResult.urls.length) {
      throw new Error('No image URLs returned from PDF conversion')
    }

    // Use OpenAI to analyze the image
    console.log('Sending image to OpenAI for analysis...')
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
            content: "You are a product information extraction assistant. Extract and structure key information from product documents into a clear, organized format."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this product document titled "${document.filename}" and extract key information like product names, numbers, specifications, and any other relevant details. Format the information in a clear, structured way.`
              },
              {
                type: "image_url",
                image_url: pdfResult.urls[0]
              }
            ]
          }
        ]
      })
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API Error:', errorText)
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const analysisResult = await openAIResponse.json()
    console.log('OpenAI Analysis completed successfully')

    // Update document with analysis results
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: analysisResult.choices[0].message.content,
        metadata: {
          processed: true,
          processed_at: new Date().toISOString(),
          model_used: "gpt-4o",
          pages_processed: 1
        }
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Failed to update document:', updateError)
      throw new Error(`Failed to update document: ${updateError.message}`)
    }

    console.log('Document processing completed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Document processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})