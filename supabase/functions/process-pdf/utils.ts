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