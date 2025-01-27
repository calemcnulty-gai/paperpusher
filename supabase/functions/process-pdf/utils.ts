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
    throw new Error(`Job status check failed: ${await response.text()}`)
  }

  const result = await response.json()
  
  if (result.status === 'error') {
    throw new Error(`Job failed: ${result.message || 'Unknown error'}`)
  }

  let urls: string[] = []
  if (result.url) {
    const urlPath = new URL(result.url).pathname
    if (urlPath.toLowerCase().endsWith('.json')) {
      const jsonResponse = await fetch(result.url)
      if (!jsonResponse.ok) {
        throw new Error(`Failed to fetch JSON result: ${await jsonResponse.text()}`)
      }
      urls = await jsonResponse.json()
      if (!Array.isArray(urls)) {
        throw new Error('JSON response was not an array of URLs')
      }
    } else {
      urls = [result.url]
    }
  }
  
  // Validate that all URLs have valid image extensions
  const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  const validUrls = urls.filter(url => {
    const urlPath = new URL(url).pathname
    const lowercaseUrl = urlPath.toLowerCase()
    return validExtensions.some(ext => lowercaseUrl.endsWith(ext))
  })

  if (validUrls.length === 0) {
    throw new Error('No valid image URLs found in response')
  }
  
  return {
    status: result.status,
    urls: validUrls
  }
}

export const convertPDFToImage = async (pdfData: Uint8Array): Promise<string[]> {
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key is not configured')
  }

  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('file', blob, 'document.pdf')

  const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey
    },
    body: formData
  })

  if (!uploadResponse.ok) {
    throw new Error(`PDF upload failed: ${await uploadResponse.text()}`)
  }

  const uploadResult = await uploadResponse.json()

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
    throw new Error(`PDF conversion failed: ${await pdfResponse.text()}`)
  }

  const pdfResult = await pdfResponse.json()
  if (!pdfResult.jobId) {
    throw new Error('No jobId returned from PDF conversion')
  }

  // Poll for job completion
  let jobInfo;
  do {
    await sleep(2000)
    jobInfo = await checkJobStatus(pdfResult.jobId, pdfCoApiKey)
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
  console.log('\n=== Starting OpenAI Analysis ===')
  console.log('Processing:', filename)
  console.log('Image URL:', imageUrl)

  const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiApiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  console.log('Preparing OpenAI request payload...')
  const requestPayload = {
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content: `You are a product info extraction assistant. Return your answer as valid JSON, with no extra text or formatting. Only include the JSON object, nothing else. No markdown, no code blocks, no additional commentary.

The JSON must follow this exact schema:
{
  "name": string,           // Product name/title
  "sku": string,           // Product SKU or ID
  "brand": string,         // Brand name
  "category": string,      // Product category
  "size": string,          // Size information
  "color": string,         // Color information
  "material": string,      // Material information
  "price": number,         // Price as number only
  "product_number": string, // Product model/number
  "description": string,   // Product description
  "specifications": {},    // Additional specs
  "season": string,        // Season information
  "extracted_metadata": {} // Any other data
}`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract product information from this document titled "${filename}" and return strictly as JSON. Return ONLY the JSON object with no additional text, formatting, or explanation.`
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
    max_tokens: 4096,
    temperature: 0
  }
  
  console.log('Sending request to OpenAI API...')
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload)
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
  console.log('\nOpenAI Analysis completed')
  console.log('Response status:', openAIResponse.status)
  console.log('Response headers:', Object.fromEntries(openAIResponse.headers))
  console.log('Raw content:', analysisResult.choices[0].message.content)

  // Parse the JSON content with robust error handling
  try {
    const content = analysisResult.choices[0].message.content || ''
    
    // Try to isolate the JSON object if GPT occasionally wraps or adds text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON object found in response')
      throw new Error('No JSON object found in response')
    }
    
    const jsonStr = jsonMatch[0]
    console.log('Extracted JSON string:', jsonStr)
    
    let productData
    try {
      productData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed JSON string:', jsonStr)
      throw new Error('Failed to parse JSON response')
    }
    
    // Ensure all required fields exist with defaults
    const template = {
      name: null,
      sku: null,
      brand: null,
      category: 'shoes',
      size: null,
      color: null,
      material: null,
      price: null,
      product_number: null,
      description: null,
      specifications: {},
      season: 'all',
      extracted_metadata: {}
    }
    
    const result = { ...template, ...productData }
    console.log('Final parsed product data:', JSON.stringify(result, null, 2))
    console.log('=== End OpenAI Analysis ===\n')
    
    return result
  } catch (error) {
    console.error('Failed to process OpenAI response:', error)
    console.error('Full OpenAI response:', analysisResult)
    throw new Error(`Failed to process product data: ${error.message}`)
  }
}

export const createProduct = async (supabase: any, documentId: string, productData: any) => {
  console.log('\n=== Creating Product ===')
  console.log('Document ID:', documentId)
  console.log('Product Data:', JSON.stringify(productData, null, 2))

  // Ensure required fields are present
  if (!productData.name || !productData.sku) {
    throw new Error('Product name and SKU are required')
  }

  const productInsert = {
    document_id: documentId,
    name: productData.name,
    sku: productData.sku,
    brand: productData.brand,
    category: productData.category || 'shoes',
    size: productData.size,
    color: productData.color,
    material: productData.material,
    price: productData.price ? Number(productData.price) : null,
    product_number: productData.product_number,
    description: productData.description,
    specifications: productData.specifications || {},
    season: productData.season || 'all',
    extracted_metadata: productData.extracted_metadata || {},
    processing_status: 'processed'
  }

  console.log('Inserting product:', JSON.stringify(productInsert, null, 2))
  const { data: product, error } = await supabase
    .from('products')
    .insert(productInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    throw error
  }

  console.log('Product created successfully:', product.id)
  console.log('=== End Product Creation ===\n')

  return product
}

export const updateDocumentContent = async (supabase: any, documentId: string, content: string, pagesProcessed: number = 1) => {
  console.log('\n=== Updating Document Content ===')
  console.log('Document ID:', documentId)
  console.log('Pages processed:', pagesProcessed)
  console.log('Content length:', content.length)
  console.log('Content preview:', content.substring(0, 500) + '...')

  const updateData = {
    content: content,
    metadata: {
      processed: true,
      processed_at: new Date().toISOString(),
      model_used: "gpt-4-vision-preview",
      pages_processed: pagesProcessed
    }
  }
  console.log('Update payload:', JSON.stringify(updateData, null, 2))

  const { error: updateError } = await supabase
    .from('document_embeddings')
    .update(updateData)
    .eq('id', documentId)

  if (updateError) {
    console.error('Error updating document:', updateError)
    throw updateError
  }

  console.log('Document successfully updated')
  console.log('=== End Document Update ===\n')
}