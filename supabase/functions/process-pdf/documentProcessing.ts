import "https://deno.land/x/xhr@0.1.0/mod.ts"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const downloadAndConvertPDF = async (supabase: any, filePath: string) => {
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Downloading PDF from storage bucket (attempt ${attempt}/${maxRetries}):`, filePath)
      
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('product_docs')
        .download(filePath)

      if (fileError) {
        console.error(`Storage error on attempt ${attempt}:`, {
          error: fileError,
          name: fileError.name,
          message: fileError.message,
          details: fileError.details,
          hint: fileError.hint,
          code: fileError.code
        })
        
        // Check if this is a temporary error that might resolve with a retry
        if (
          fileError.name === 'StorageUnknownError' ||
          fileError.status === 502 ||
          fileError.status === 503 ||
          fileError.status === 504
        ) {
          lastError = fileError
          if (attempt < maxRetries) {
            console.log(`Waiting ${retryDelay}ms before retry...`)
            await sleep(retryDelay)
            continue
          }
        }
        
        // If we get here, either:
        // 1. This is not a retryable error
        // 2. We've exhausted our retries
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
      
    } catch (error) {
      lastError = error
      
      // If this isn't the last attempt, continue to next retry
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`)
        await sleep(retryDelay)
        continue
      }
      
      // If we've exhausted all retries, throw the last error
      console.error('All download attempts failed. Last error:', lastError)
      throw new Error(`Failed to download PDF after ${maxRetries} attempts: ${lastError.message}`)
    }
  }
  
  // This should never be reached due to the return or throw above
  throw new Error('Unexpected end of download function')
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
      model_used: "gpt-4o",
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