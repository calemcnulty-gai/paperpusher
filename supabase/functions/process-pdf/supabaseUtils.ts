import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export function initSupabaseClient() {
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

export async function downloadAndConvertPDF(supabase: any, filePath: string) {
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

export async function updateDocumentContent(supabase: any, documentId: string, content: string) {
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