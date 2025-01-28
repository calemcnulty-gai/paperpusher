import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, initSupabaseClient } from './supabaseClient.ts'
import { downloadAndConvertPDF, updateDocumentContent } from './documentProcessing.ts'
import { createProduct } from './productProcessing.ts'
import { convertPDFToImage } from './pdfProcessing.ts'
import { analyzeImageWithOpenAI } from './openaiProcessing.ts'
import { DocumentEmbedding, ProcessingResult, ProductData } from './types.ts'

// Track processing documents to prevent duplicate requests
const processingFiles = new Set<string>()

const processDocument = async (supabase: any, doc: DocumentEmbedding, file_path: string): Promise<ProcessingResult> => {
  try {
    // Update status to processing
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
        processing_error: null,
        pages_processed: 0
      })
      .eq('id', doc.id)

    const base64Pdf = await downloadAndConvertPDF(supabase, file_path)
    console.log('PDF downloaded and converted to base64')

    const imageUrls = await convertPDFToImage(base64Pdf)
    console.log('PDF converted to images:', imageUrls)

    // Update total pages
    await supabase
      .from('document_embeddings')
      .update({
        total_pages: imageUrls.length
      })
      .eq('id', doc.id)

    // Analyze each page and create products
    const products: any[] = []
    const allAnalyses: ProductData[] = []
    let catalogBrand: string | null = null // Track brand across pages
    
    for (let index = 0; index < imageUrls.length; index++) {
      console.log(`Analyzing page ${index + 1}/${imageUrls.length}`)
      const imageUrl = imageUrls[index]
      const productData = await analyzeImageWithOpenAI(imageUrl, `${doc.filename} - Page ${index + 1}`)
      allAnalyses.push(productData)
      
      // Track brand information if found
      if (productData.brand) {
        // A page is a cover/intro page if it has a brand but no product details
        const isCoverPage = !productData.name && !productData.sku && 
                          (!productData.wholesale_price || productData.wholesale_price === 0) &&
                          (!productData.retail_price || productData.retail_price === 0)
        
        if (isCoverPage) {
          console.log(`Found brand "${productData.brand}" on cover page ${index + 1}`)
          catalogBrand = productData.brand
        } else if (!catalogBrand) {
          console.log(`Found brand "${productData.brand}" on product page ${index + 1} (fallback)`)
          catalogBrand = productData.brand
        }
      }
      
      // Skip product creation for pages without product details
      if (!productData.name) {
        if (productData.sku) {
          productData.name = productData.sku
        } else {
          console.log(`Skipping product creation for page ${index + 1} - no product details found`)
          continue
        }
      }
      
      // Apply catalog brand if product has no brand
      if (catalogBrand) {
        if (!productData.brand || productData.brand.trim() === '') {
          console.log(`Applying catalog brand "${catalogBrand}" to product with no brand:`, productData.name)
          productData.brand = catalogBrand
        } else if (productData.brand !== catalogBrand) {
          console.log(`Warning: Product "${productData.name}" has different brand "${productData.brand}" than catalog brand "${catalogBrand}"`)
          console.log(`Overriding with catalog brand "${catalogBrand}"`)
          productData.brand = catalogBrand
        }
      }
      
      console.log(`Creating product from page ${index + 1} - Name: ${productData.name}, SKU: ${productData.sku}, Brand: ${productData.brand}`)
      const product = await createProduct(supabase, doc.id, productData, imageUrl)
      if (product) {
        products.push(product)
      } else {
        console.log(`Skipped duplicate product with SKU "${productData.sku}" from page ${index + 1}`)
      }

      // Update progress
      await supabase
        .from('document_embeddings')
        .update({
          pages_processed: index + 1
        })
        .eq('id', doc.id)
    }

    // Combine all analyses into one document
    const combinedContent = allAnalyses.map((content, index) => 
      `=== Page ${index + 1} ===\n${JSON.stringify(content, null, 2)}`
    ).join('\n\n')

    await updateDocumentContent(supabase, doc.id, combinedContent)

    // Update final status
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'completed',
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', doc.id)

    return {
      success: true,
      pages_processed: imageUrls.length,
      products_created: products.length
    }

  } catch (error) {
    console.error('Error processing document:', error)
    
    // Update error status
    await supabase
      .from('document_embeddings')
      .update({
        processing_status: 'failed',
        processing_completed_at: new Date().toISOString(),
        processing_error: error.message
      })
      .eq('id', doc.id)

    throw error
  } finally {
    processingFiles.delete(file_path)
    console.log('Removed file from processing set:', file_path)
  }
}

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
      .select('id, content, filename, processing_status')
      .eq('file_path', file_path)
      .single()

    if (docError) {
      console.error('Error finding document:', docError)
      throw new Error('Could not find document record')
    }

    if (doc.processing_status === 'completed' && doc.content) {
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

    // Add to processing set
    processingFiles.add(file_path)
    console.log('Added file to processing set:', file_path)

    // Start processing in background
    processDocument(supabase, doc, file_path).catch(error => {
      console.error('Background processing error:', error)
    })

    // Return immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processing started',
        document_id: doc.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 
      }
    )

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