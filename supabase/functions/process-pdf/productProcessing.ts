import { ProductData } from './types.ts'
import { storeProductImage } from './imageProcessing.ts'

export const createProduct = async (supabase: any, documentId: string, productData: ProductData, imageUrl?: string) => {
  console.log('\n=== Creating Product ===')
  console.log('Document ID:', documentId)
  console.log('Product Data:', JSON.stringify(productData, null, 2))
  console.log('Source Image URL:', imageUrl)

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

  try {
    console.log('Attempting to insert product:', JSON.stringify(productInsert, null, 2))
    const { data: product, error } = await supabase
      .from('products')
      .insert(productInsert)
      .select()
      .single()

    if (error) {
      // Check if this is a unique constraint violation on SKU
      if (error.code === '23505' && error.message.includes('products_sku_key')) {
        console.log(`Product with SKU "${productData.sku}" already exists, skipping...`)
        // Return null to indicate product was skipped
        return null
      }
      // For any other error, throw it
      console.error('Error creating product:', error)
      throw error
    }

    console.log('Product created successfully:', product.id)
    console.log('=== End Product Creation ===\n')
    return product
  } catch (error) {
    // Handle any other unexpected errors
    if (error.code === '23505' && error.message.includes('products_sku_key')) {
      console.log(`Product with SKU "${productData.sku}" already exists, skipping...`)
      return null
    }
    throw error
  }
} 