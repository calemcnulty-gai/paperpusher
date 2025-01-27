import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders,
  initSupabaseClient,
  getDocument,
  downloadAndConvertPDF,
  convertPDFToImage,
  analyzeImageWithOpenAI,
  updateDocumentContent
} from './utils.ts'

// Track processing documents to prevent duplicate requests
const processingDocuments = new Set()

serve(async (req) => {
  console.log('=== PDF Processing Function Started ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body))
    
    const { document_id } = body
    
    if (!document_id) {
      console.error('Error: Missing document_id in request')
      throw new Error('Document ID is required')
    }

    // Check if document is already being processed
    if (processingDocuments.has(document_id)) {
      console.log('Document already being processed:', document_id)
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
      // Add document to processing set
      processingDocuments.add(document_id)
      console.log('Processing document with ID:', document_id)

      const supabase = initSupabaseClient()
      console.log('Supabase client initialized')

      const document = await getDocument(supabase, document_id)
      console.log('Document retrieved:', { id: document.id, filename: document.filename })

      const base64Pdf = await downloadAndConvertPDF(supabase, document.file_path)
      console.log('PDF downloaded and converted to base64')

      const imageUrl = await convertPDFToImage(base64Pdf)
      console.log('PDF converted to image:', imageUrl)

      const analysisResult = await analyzeImageWithOpenAI(imageUrl, document.filename)
      console.log('OpenAI analysis completed')

      await updateDocumentContent(supabase, document_id, analysisResult.choices[0].message.content)
      console.log('Document content updated successfully')

      return new Response(
        JSON.stringify({ success: true, message: 'Document processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } finally {
      // Always remove document from processing set, even if there's an error
      processingDocuments.delete(document_id)
      console.log('Removed document from processing:', document_id)
    }

  } catch (error) {
    console.error('Error in process-pdf function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: error.status || 500 
      }
    )
  }
})