import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== PDF Processing Function Started ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    console.log('Parsing request body...')
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { document_id } = body
    
    if (!document_id) {
      console.error('Error: Missing document_id in request')
      throw new Error('Document ID is required')
    }

    console.log('Processing document with ID:', document_id)

    // Initialize Supabase client
    console.log('Initializing Supabase client...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Log key presence and partial values for debugging
    console.log('Supabase URL present:', !!supabaseUrl)
    console.log('Supabase key present:', !!supabaseKey)
    if (supabaseUrl) console.log('Supabase URL prefix:', supabaseUrl.substring(0, 10) + '...')
    if (supabaseKey) console.log('Supabase key prefix:', supabaseKey.substring(0, 5) + '...')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Missing Supabase credentials')
      throw new Error('Supabase configuration is incomplete')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized')

    // Get document details
    console.log('Fetching document details from database...')
    const { data: document, error: docError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError) {
      console.error('Database error when fetching document:', docError)
      throw docError
    }

    if (!document) {
      console.error('Document not found in database')
      throw new Error('Document not found')
    }

    console.log('Retrieved document:', {
      id: document.id,
      filename: document.filename,
      file_path: document.file_path
    })

    // Get the PDF file from storage
    console.log('Downloading PDF from storage...')
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('product_docs')
      .download(document.file_path)

    if (fileError) {
      console.error('Storage error when downloading file:', fileError)
      throw fileError
    }

    if (!fileData) {
      console.error('No file data received from storage')
      throw new Error('File data is empty')
    }

    console.log('Successfully downloaded PDF file')

    // Convert PDF to base64
    console.log('Converting PDF to base64...')
    const pdfData = await fileData.arrayBuffer()
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)))
    console.log('PDF converted to base64, length:', base64Pdf.length)

    // Verify PDF.co API key
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    console.log('PDF.co API key present:', !!pdfCoApiKey)
    if (pdfCoApiKey) console.log('PDF.co key prefix:', pdfCoApiKey.substring(0, 5) + '...')
    
    if (!pdfCoApiKey) {
      console.error('Error: Missing PDF.co API key')
      throw new Error('PDF.co API key is not configured')
    }

    // Convert PDF to PNG using PDF.co API
    console.log('Sending request to PDF.co API...')
    const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Pdf,
        pages: "1",
        async: false
      })
    })

    console.log('PDF.co response status:', pdfResponse.status)
    console.log('PDF.co response headers:', Object.fromEntries(pdfResponse.headers.entries()))

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      console.error('PDF.co API Error:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        error: errorText
      })
      throw new Error(`PDF conversion failed: ${errorText}`)
    }

    const pdfResult = await pdfResponse.json()
    console.log('PDF.co conversion successful:', {
      urls: pdfResult.urls ? pdfResult.urls.length : 0,
      response: JSON.stringify(pdfResult)
    })

    if (!pdfResult.urls || !pdfResult.urls.length) {
      console.error('No image URLs returned from PDF conversion')
      throw new Error('No image URLs returned from PDF conversion')
    }

    // Verify OpenAI API key
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API key present:', !!openAiApiKey)
    if (openAiApiKey) console.log('OpenAI key prefix:', openAiApiKey.substring(0, 5) + '...')
    
    if (!openAiApiKey) {
      console.error('Error: Missing OpenAI API key')
      throw new Error('OpenAI API key is not configured')
    }

    // Use OpenAI to analyze the image
    console.log('Sending request to OpenAI API...')
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
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
        ],
        max_tokens: 4096
      })
    })

    console.log('OpenAI response status:', openAIResponse.status)
    console.log('OpenAI response headers:', Object.fromEntries(openAIResponse.headers.entries()))

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error('OpenAI API Error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        error: errorText
      })
      throw new Error(`OpenAI API error: ${errorText}`)
    }

    const analysisResult = await openAIResponse.json()
    console.log('OpenAI Analysis completed successfully:', {
      response: JSON.stringify(analysisResult)
    })

    // Update document with analysis results
    console.log('Updating document with analysis results...')
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: analysisResult.choices[0].message.content,
        metadata: {
          processed: true,
          processed_at: new Date().toISOString(),
          model_used: "gpt-4-vision-preview",
          pages_processed: 1
        }
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error updating document with analysis:', updateError)
      throw updateError
    }

    console.log('Document processing completed successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Document processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-pdf function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})