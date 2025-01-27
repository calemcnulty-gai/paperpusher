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