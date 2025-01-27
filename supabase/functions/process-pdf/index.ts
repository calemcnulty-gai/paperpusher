import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders,
  initSupabaseClient,
  downloadAndConvertPDF,
  convertPDFToImage,
  analyzeImageWithOpenAI,
  updateDocumentContent
} from './utils.ts'

// Track processing documents to prevent duplicate requests
const processingFiles = new Set()

serve(async (req) => {
  console.log('=== PDF Processing Function Started ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
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
        console.error(`Missing required environment variable: ${envVar}`)
        throw new Error(`Configuration error: ${envVar} is not set`)
      }
    }

    const { file_path } = await req.json()
    console.log('Processing request for file:', file_path)
    
    if (!file_path) {
      console.error('Error: Missing file_path in request')
      throw new Error('File path is required')
    }

    // Initialize Supabase client
    const supabase = initSupabaseClient()
    console.log('Supabase client initialized')

    // Find the document record for this file
    const { data: doc, error: docError } = await supabase
      .from('document_embeddings')
      .select('id, content')
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

      const imageUrl = await convertPDFToImage(base64Pdf)
      console.log('PDF converted to image:', imageUrl)

      const analysisResult = await analyzeImageWithOpenAI(imageUrl, doc.filename)
      console.log('OpenAI analysis completed')

      await updateDocumentContent(supabase, doc.id, analysisResult.choices[0].message.content)
      console.log('Document content updated successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document processed successfully' 
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