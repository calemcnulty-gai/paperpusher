import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const initSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log('Initializing Supabase client...')
  console.log('Supabase URL present:', !!supabaseUrl)
  console.log('Supabase key present:', !!supabaseKey)
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is incomplete')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export const getDocument = async (supabase: any, documentId: string) => {
  console.log('Fetching document details from database...')
  const { data: document, error: docError } = await supabase
    .from('document_embeddings')
    .select('*')
    .eq('id', documentId)
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

  return document
}

export const downloadAndConvertPDF = async (supabase: any, filePath: string) => {
  console.log('Downloading PDF from storage...')
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('product_docs')
    .download(filePath)

  if (fileError) {
    console.error('Storage error when downloading file:', fileError)
    throw fileError
  }

  if (!fileData) {
    console.error('No file data received from storage')
    throw new Error('File data is empty')
  }

  console.log('Successfully downloaded PDF file')
  console.log('Converting PDF to base64...')
  
  const uint8Array = new Uint8Array(await fileData.arrayBuffer())
  const base64Pdf = encode(uint8Array)
  
  console.log('PDF converted to base64, length:', base64Pdf.length)
  return base64Pdf
}

export const convertPDFToImage = async (base64Pdf: string) => {
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
  console.log('PDF.co API key present:', !!pdfCoApiKey)
  
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key is not configured')
  }

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
  const responseHeaders = Object.fromEntries(pdfResponse.headers.entries())
  console.log('PDF.co response headers:', responseHeaders)

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
    throw new Error('No image URLs returned from PDF conversion')
  }

  return pdfResult.urls[0]
}

export const analyzeImageWithOpenAI = async (imageUrl: string, filename: string) => {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
  console.log('OpenAI API key present:', !!openAiApiKey)
  
  if (!openAiApiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  console.log('Sending request to OpenAI API...')
  console.log('Image URL:', imageUrl)
  console.log('Filename:', filename)
  
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
              text: `Please analyze this product document titled "${filename}" and extract key information like product names, numbers, specifications, and any other relevant details. Format the information in a clear, structured way.`
            },
            {
              type: "image_url",
              image_url: imageUrl
            }
          ]
        }
      ],
      max_tokens: 4096
    })
  })

  console.log('OpenAI response status:', openAIResponse.status)
  const responseHeaders = Object.fromEntries(openAIResponse.headers.entries())
  console.log('OpenAI response headers:', responseHeaders)

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
  console.log('OpenAI Analysis completed successfully')
  console.log('Analysis result:', JSON.stringify(analysisResult))

  return analysisResult
}

export const updateDocumentContent = async (supabase: any, documentId: string, content: string) => {
  console.log('Updating document with analysis results...')
  const { error: updateError } = await supabase
    .from('document_embeddings')
    .update({
      content: content,
      metadata: {
        processed: true,
        processed_at: new Date().toISOString(),
        model_used: "gpt-4-vision-preview",
        pages_processed: 1
      }
    })
    .eq('id', documentId)

  if (updateError) {
    console.error('Error updating document with analysis:', updateError)
    throw updateError
  }

  console.log('Document processing completed successfully')
}