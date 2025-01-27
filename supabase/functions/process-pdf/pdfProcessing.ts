import { corsHeaders } from './corsHeaders.ts'

interface PDFConversionResponse {
  jobId?: string;
  status?: string;
  error?: string;
  url?: string;
}

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
  const convertUrl = new URL('https://api.pdf.co/v1/pdf/convert/to/png')
  convertUrl.searchParams.append('url', uploadResult.url)
  convertUrl.searchParams.append('async', 'true')
  convertUrl.searchParams.append('pages', '1-')

  const pdfResponse = await fetch(convertUrl.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': pdfCoApiKey
    }
  })

  if (!pdfResponse.ok) {
    const errorText = await pdfResponse.text()
    console.error('PDF.co conversion error:', {
      status: pdfResponse.status,
      statusText: pdfResponse.statusText,
      error: errorText
    })
    throw new Error(`PDF conversion failed: ${errorText}`)
  }

  const pdfResult: PDFConversionResponse = await pdfResponse.json()
  console.log('Async conversion started:', pdfResult)

  if (!pdfResult.jobId) {
    throw new Error('No jobId returned from PDF conversion')
  }

  // Poll for job completion
  let status: string
  do {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between checks
    status = await checkJobStatus(pdfResult.jobId!, pdfCoApiKey)
    console.log('Current job status:', status)
  } while (status === 'working')

  if (status !== 'success') {
    throw new Error(`PDF conversion failed with status: ${status}`)
  }

  // Get the final result
  const result = await getJobResult(pdfResult.jobId, pdfCoApiKey)
  if (!result.url) {
    throw new Error('No image URL in job result')
  }

  return result.url
}

async function checkJobStatus(jobId: string, apiKey: string): Promise<string> {
  console.log('Checking job status for:', jobId)
  const url = new URL('https://api.pdf.co/v1/job/check')
  url.searchParams.append('jobid', jobId)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Job status check error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    })
    throw new Error(`Job status check failed: ${errorText}`)
  }

  const result: PDFConversionResponse = await response.json()
  console.log('Job status result:', result)
  
  if (result.status === 'error') {
    throw new Error(`Job failed: ${result.error || 'Unknown error'}`)
  }
  
  return result.status || 'error'
}

async function getJobResult(jobId: string, apiKey: string): Promise<PDFConversionResponse> {
  console.log('Getting job result for:', jobId)
  const url = new URL('https://api.pdf.co/v1/job/check')
  url.searchParams.append('jobid', jobId)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': apiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Job result error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    })
    throw new Error(`Failed to get job result: ${errorText}`)
  }

  const result: PDFConversionResponse = await response.json()
  console.log('Job result:', result)
  
  if (result.status === 'error') {
    throw new Error(`Failed to get result: ${result.error}`)
  }
  
  if (!result.url) {
    throw new Error('No image URL returned in job result')
  }

  return result
}