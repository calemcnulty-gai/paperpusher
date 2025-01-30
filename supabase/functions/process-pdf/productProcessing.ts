import { ProductData } from './types.ts'
import { storeProductImage } from './imageProcessing.ts'

const simplifyJson = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(simplifyJson)
  }
  
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip null values
    if (value === null) continue
    
    // Convert nested objects to string if they're too deep
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      const depth = JSON.stringify(value).split('{').length - 1
      if (depth > 2) {
        result[key] = JSON.stringify(value)
      } else {
        result[key] = simplifyJson(value)
      }
    } else {
      result[key] = value
    }
  }
  return result
}

export const createProduct = async (supabase: any, documentId: string, productData: ProductData, imageUrl?: string) => {
  console.log('\n=== Creating Product ===')
  console.log('Document ID:', documentId)
  console.log('Product Data:', JSON.stringify(productData, null, 2))
  console.log('Source Image URL:', imageUrl)

  // Ensure SKU is present (the only truly required field)
  if (!productData.sku) {
    throw new Error('Product SKU is required')
  }

  // If we have an image URL, store it in Supabase
  let storedImageUrl: string | null = null
  if (imageUrl && productData.sku) {
    try {
      storedImageUrl = await storeProductImage(supabase, imageUrl, productData.sku)
      console.log('Image stored in Supabase:', storedImageUrl)
    } catch (error) {
      console.error('Failed to store product image:', error)
      // Continue without image if storage fails
    }
  }

  // Extract only the essential data we need
  const productInsert = {
    document_id: documentId,
    name: productData.name || productData.sku, // Use SKU as name if name is null
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
    season: productData.season || 'all',
    processing_status: 'processed',
    image_url: storedImageUrl
  }

  try {
    console.log('Attempting to insert product:', JSON.stringify(productInsert, null, 2))
    
    // First, check if product with this SKU already exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, sku')
      .eq('sku', productData.sku)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking for existing product:', checkError)
      throw checkError
    }

    if (existingProduct) {
      console.log(`Product with SKU "${productData.sku}" already exists (id: ${existingProduct.id}), skipping...`)
      return null
    }

    // If we get here, the product doesn't exist, so try to insert it
    console.log('No existing product found, proceeding with insert...')
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert(productInsert)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting product:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      throw insertError
    }

    if (!product) {
      console.error('No product returned after successful insert')
      throw new Error('Product insert succeeded but no data returned')
    }

    console.log('Product created successfully:', {
      id: product.id,
      sku: product.sku,
      name: product.name
    })
    console.log('=== End Product Creation ===\n')
    return product
  } catch (error) {
    console.error('Unexpected error in createProduct:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    })
    throw error
  }
} 