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

    console.log('Processing document with ID:', document_id)

    const supabase = initSupabaseClient()
    const document = await getDocument(supabase, document_id)
    const base64Pdf = await downloadAndConvertPDF(supabase, document.file_path)
    const imageUrl = await convertPDFToImage(base64Pdf)
    const analysisResult = await analyzeImageWithOpenAI(imageUrl, document.filename)
    await updateDocumentContent(supabase, document_id, analysisResult.choices[0].message.content)

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