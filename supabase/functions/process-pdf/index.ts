import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from './corsHeaders.ts'
import { initSupabaseClient, downloadAndConvertPDF, updateDocumentContent, createProduct } from './utils.ts'
import { convertPDFToImage } from './pdfProcessing.ts'
import { analyzeImageWithOpenAI } from './openaiProcessing.ts'

// Track processing documents to prevent duplicate requests
const processingFiles = new Set()

serve(async (req) => {
  console.log('=== PDF Processing Function Started ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'PDF_CO_API_KEY',
      'OPENAI_API_KEY'
    ]
    
    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Configuration error: ${envVar} is not set`)
      }
    }

    const { file_path } = await req.json()
    console.log('Processing request for file:', file_path)
    
    if (!file_path) {
      throw new Error('File path is required')
    }

    const supabase = initSupabaseClient()
    console.log('Supabase client initialized')

    const { data: doc, error: docError } = await supabase
      .from('document_embeddings')
      .select('id, content, filename')
      .eq('file_path', file_path)
      .single()

    if (docError) {
      console.error('Error finding document:', docError)
      throw new Error('Could not find document record')
    }

    if (doc.content) {
      console.log('Document already processed:', doc.id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already processed' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (processingFiles.has(file_path)) {
      console.log('File already being processed:', file_path)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Document is already being processed' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      )
    }

    try {
      processingFiles.add(file_path)
      console.log('Added file to processing set:', file_path)

      const base64Pdf = await downloadAndConvertPDF(supabase, file_path)
      console.log('PDF downloaded and converted to base64')

      const imageUrls = await convertPDFToImage(base64Pdf)
      console.log('PDF converted to images:', imageUrls)

      // Analyze each page and create products
      const products = []
      const allAnalyses = []
      
      for (let index = 0; index < imageUrls.length; index++) {
        console.log(`Analyzing page ${index + 1}/${imageUrls.length}`)
        const imageUrl = imageUrls[index]
        const productData = await analyzeImageWithOpenAI(imageUrl, `${doc.filename} - Page ${index + 1}`)
        allAnalyses.push(productData)
        
        // If the product data has required fields, create a product
        if (productData.name && productData.sku) {
          console.log(`Creating product from page ${index + 1}`)
          const product = await createProduct(supabase, doc.id, productData, imageUrl)
          products.push(product)
        }
      }

      // Combine all analyses into one document
      const combinedContent = allAnalyses.map((content, index) => 
        `=== Page ${index + 1} ===\n${JSON.stringify(content, null, 2)}`
      ).join('\n\n')

      await updateDocumentContent(supabase, doc.id, combinedContent, imageUrls.length)
      console.log('Document content updated successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document processed successfully',
          pages_processed: imageUrls.length,
          products_created: products.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } finally {
      processingFiles.delete(file_path)
      console.log('Removed file from processing set:', file_path)
    }

  } catch (error) {
    console.error('Error in process-pdf function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: error.status || 500 
      }
    )
  }
})