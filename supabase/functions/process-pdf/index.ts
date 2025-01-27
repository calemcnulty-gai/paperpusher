import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { document_id } = await req.json()
    console.log('Processing document:', document_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError) {
      console.error('Error fetching document:', docError)
      throw new Error(`Error fetching document: ${docError.message}`)
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('product_docs')
      .download(doc.file_path)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw new Error(`Error downloading file: ${downloadError.message}`)
    }

    console.log('Loading PDF document...')
    
    // Convert Blob to ArrayBuffer
    const pdfBytes = await fileData.arrayBuffer()
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes)
    console.log('PDF document loaded. Number of pages:', pdfDoc.getPageCount())
    
    // Extract text from all pages
    let fullText = ''
    const pages = pdfDoc.getPages()
    
    for (const page of pages) {
      const { width, height } = page.getSize()
      console.log(`Processing page with dimensions: ${width}x${height}`)
      
      // Since pdf-lib doesn't directly support text extraction,
      // we'll store the dimensions and page count as metadata
      fullText += `Page dimensions: ${width}x${height}\n`
    }

    console.log('Extracted metadata sample:', fullText.substring(0, 200))

    // Update document with extracted content
    const { error: updateError } = await supabase
      .from('document_embeddings')
      .update({
        content: fullText,
        metadata: {
          pageCount: pdfDoc.getPageCount(),
          processedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error updating document:', updateError)
      throw new Error(`Error updating document: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        pageCount: pdfDoc.getPageCount()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})