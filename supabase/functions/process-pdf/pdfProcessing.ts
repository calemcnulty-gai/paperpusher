import { corsHeaders } from './corsHeaders.ts'

export async function convertPDFToImage(pdfData: Uint8Array): Promise<string> {
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
  console.log('PDF.co API key present:', !!pdfCoApiKey)
  
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key is not configured')
  }

  // Create form data for file upload
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('file', blob, 'document.pdf')

  // First, upload the file to PDF.co temporary storage
  console.log('Uploading PDF to PDF.co temporary storage...')
  const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey
    },
    body: formData
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error('PDF.co upload error:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      error: errorText
    })
    throw new Error(`PDF upload failed: ${errorText}`)
  }

  const uploadResult = await uploadResponse.json()
  console.log('PDF uploaded to PDF.co:', uploadResult)

  // Convert PDF to PNG using the uploaded file URL
  console.log('Starting PDF to PNG conversion...')
  const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: uploadResult.url,
      pages: "1-1", // Only convert first page
      async: false  // Wait for the result
    })
  })

  if (!convertResponse.ok) {
    const errorText = await convertResponse.text()
    console.error('PDF.co conversion error:', {
      status: convertResponse.status,
      statusText: convertResponse.statusText,
      error: errorText
    })
    throw new Error(`PDF conversion failed: ${errorText}`)
  }

  const conversionResult = await convertResponse.json()
  console.log('PDF.co conversion result:', conversionResult)

  if (conversionResult.error) {
    throw new Error(`PDF conversion failed: ${conversionResult.message}`)
  }

  if (!conversionResult.url) {
    throw new Error('No image URL in conversion result')
  }

  // Verify we got a PNG URL back
  console.log('Conversion successful, image URL:', conversionResult.url)
  if (!conversionResult.url.toLowerCase().endsWith('.png')) {
    console.warn('Warning: Converted file may not be PNG format:', conversionResult.url)
  }

  return conversionResult.url
}