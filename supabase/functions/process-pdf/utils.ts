import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { ProductData } from './types.ts'

export { corsHeaders, initSupabaseClient } from './supabaseClient.ts'
export { downloadAndConvertPDF, updateDocumentContent } from './documentProcessing.ts'
export { storeProductImage } from './imageProcessing.ts'
export { createProduct } from './productProcessing.ts'

// Add any small utility functions here if needed

export const createProduct = async (supabase: any, documentId: string, productData: ProductData, imageUrl?: string) => {
  console.log('\n=== Creating Product ===')
  console.log('Document ID:', documentId)
  console.log('Product Data:', JSON.stringify(productData, null, 2))
  console.log('Source Image URL:', imageUrl)

  // Ensure required fields are present
  if (!productData.name || !productData.sku) {
    throw new Error('Product name and SKU are required')
  }

  // If we have an image URL, store it in Supabase
  let storedImageUrl: string | null = null
  if (imageUrl) {
    try {
      storedImageUrl = await storeProductImage(supabase, imageUrl, productData.sku)
      console.log('Image stored in Supabase:', storedImageUrl)
    } catch (error) {
      console.error('Failed to store product image:', error)
      // Continue without image if storage fails
    }
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
    wholesale_price: productData.wholesale_price ? Number(productData.wholesale_price) : null,
    retail_price: productData.retail_price ? Number(productData.retail_price) : null,
    product_number: productData.product_number,
    description: productData.description,
    specifications: productData.specifications || {},
    season: productData.season || 'all',
    extracted_metadata: productData.extracted_metadata || {},
    processing_status: 'processed',
    image_url: storedImageUrl
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

export const storeProductImage = async (supabase: any, imageUrl: string, productSku: string): Promise<string> => {
  console.log('\n=== Storing Product Image ===')
  console.log('Source URL:', imageUrl)
  console.log('Product SKU:', productSku)

  // Download the image
  console.log('Downloading image...')
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.statusText}`)
  }

  // Get the content type and file extension
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  const extension = contentType.split('/')[1] || 'jpg'
  
  // Create a unique filename using SKU
  const filename = `products/${productSku.toLowerCase()}.${extension}`
  console.log('Target filename:', filename)

  // Convert the image data to a Uint8Array
  const imageData = new Uint8Array(await imageResponse.arrayBuffer())
  
  // Upload to Supabase storage
  console.log('Uploading to Supabase storage...')
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('product_images')
    .upload(filename, imageData, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw uploadError
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('product_images')
    .getPublicUrl(filename)

  console.log('Image stored successfully')
  console.log('Public URL:', publicUrl)
  console.log('=== End Image Storage ===\n')

  return publicUrl
}