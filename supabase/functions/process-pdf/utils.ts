import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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

export const downloadAndConvertPDF = async (supabase: any, filePath: string) => {
  console.log('Downloading PDF from storage bucket:', filePath)
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
  
  // Convert to Uint8Array for upload
  const uint8Array = new Uint8Array(await fileData.arrayBuffer())
  return uint8Array
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function checkJobStatus(jobId: string, apiKey: string): Promise<{status: string, urls?: string[]}> {
  console.log('Checking job status for:', jobId)
  const response = await fetch(`https://api.pdf.co/v1/job/check`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobid: jobId
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Job status check error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    })
    throw new Error(`Job status check failed: ${errorText}`)
  }

  const result = await response.json()
  console.log('Job status result:', JSON.stringify(result, null, 2))
  
  if (result.status === 'error') {
    throw new Error(`Job failed: ${result.message || 'Unknown error'}`)
  }

  let urls: string[] = []
  if (result.url) {
    console.log('Found URL in result:', result.url)
    // Check if the path (not query params) ends with .json
    const urlPath = new URL(result.url).pathname
    console.log('URL path:', urlPath)
    
    if (urlPath.toLowerCase().endsWith('.json')) {
      console.log('URL path ends with .json, fetching content...')
      const jsonResponse = await fetch(result.url)
      if (!jsonResponse.ok) {
        const errorText = await jsonResponse.text()
        console.error('Failed to fetch JSON content:', {
          status: jsonResponse.status,
          statusText: jsonResponse.statusText,
          error: errorText
        })
        throw new Error(`Failed to fetch JSON result: ${errorText}`)
      }
      const jsonText = await jsonResponse.text()
      console.log('Raw JSON response:', jsonText)
      try {
        urls = JSON.parse(jsonText)
        console.log('Parsed URLs array:', urls)
      } catch (e) {
        console.error('Failed to parse JSON response:', e)
        throw new Error(`Failed to parse JSON response: ${e.message}`)
      }
      if (!Array.isArray(urls)) {
        console.error('Parsed result is not an array:', urls)
        throw new Error('JSON response was not an array of URLs')
      }
    } else {
      console.log('URL path does not end with .json, using directly')
      urls = [result.url]
    }
  } else {
    console.warn('No URL found in result')
  }
  
  console.log('URLs before validation:', urls)
  
  // Validate that all URLs have valid image extensions
  const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  const validUrls = urls.filter(url => {
    const urlPath = new URL(url).pathname
    const lowercaseUrl = urlPath.toLowerCase()
    const isValid = validExtensions.some(ext => lowercaseUrl.endsWith(ext))
    console.log(`URL validation: ${url}\nPath: ${urlPath} -> ${isValid}`)
    return isValid
  })

  console.log('Valid URLs after filtering:', validUrls)

  if (validUrls.length === 0) {
    console.error('No valid image URLs found in response. URLs received:', urls)
    throw new Error('No valid image URLs found in response')
  }
  
  return {
    status: result.status,
    urls: validUrls
  }
}

export const convertPDFToImage = async (pdfData: Uint8Array): Promise<string[]> {
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
  console.log('PDF.co API key present:', !!pdfCoApiKey)
  
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key is not configured')
  }

  // Create form data for file upload
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('file', blob, 'document.pdf')

  // First, upload the file to PDF.co
  console.log('Uploading PDF to PDF.co temporary storage...')
  const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey
    },
    body: formData
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error('PDF.co upload error:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      error: errorText
    })
    throw new Error(`PDF upload failed: ${errorText}`)
  }

  const uploadResult = await uploadResponse.json()
  console.log('PDF uploaded to PDF.co:', uploadResult)

  // Then convert the uploaded file to PNG asynchronously
  console.log('Starting async PDF to PNG conversion...')
  const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: uploadResult.url,
      pages: "1-",  // Convert all pages
      async: true   // Use async processing
    })
  })

  if (!pdfResponse.ok) {
    const errorText = await pdfResponse.text()
    console.error('PDF.co conversion error:', {
      status: pdfResponse.status,
      statusText: pdfResponse.statusText,
      error: errorText
    })
    throw new Error(`PDF conversion failed: ${errorText}`)
  }

  const pdfResult = await pdfResponse.json()
  console.log('Async conversion started:', pdfResult)

  if (!pdfResult.jobId) {
    throw new Error('No jobId returned from PDF conversion')
  }

  // Poll for job completion
  let jobInfo;
  do {
    await sleep(2000) // Wait 2 seconds between checks
    jobInfo = await checkJobStatus(pdfResult.jobId, pdfCoApiKey)
    console.log('Current job status:', jobInfo.status)
  } while (jobInfo.status === 'working')

  if (jobInfo.status !== 'success') {
    throw new Error(`PDF conversion failed with status: ${jobInfo.status}`)
  }

  if (!jobInfo.urls || !jobInfo.urls.length) {
    throw new Error('No URLs returned from successful job result')
  }

  return jobInfo.urls
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
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    })
  })

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

export const updateDocumentContent = async (supabase: any, documentId: string, content: string, pagesProcessed: number = 1) => {
  console.log('Updating document with analysis results...')
  const { error: updateError } = await supabase
    .from('document_embeddings')
    .update({
      content: content,
      metadata: {
        processed: true,
        processed_at: new Date().toISOString(),
        model_used: "gpt-4-vision-preview",
        pages_processed: pagesProcessed
      }
    })
    .eq('id', documentId)

  if (updateError) {
    console.error('Error updating document with analysis:', updateError)
    throw updateError
  }

  console.log('Document processing completed successfully')
}