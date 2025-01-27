import { corsHeaders } from './corsHeaders.ts'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function checkJobStatus(jobId: string, apiKey: string): Promise<{status: string, urls?: string[]}> {
  console.log('Checking job status for:', jobId)
  const response = await fetch(`https://api.pdf.co/v1/job/check`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobid: jobId
    })
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

  const result = await response.json()
  console.log('Raw job status response:', JSON.stringify(result, null, 2))
  
  // Log all available fields to help with debugging
  console.log('Response fields:', Object.keys(result))
  
  // First check if we have an error status
  if (result.status === 'error' || result.error === true) {
    const errorMessage = result.message || result.errorMessage || 'Unknown error'
    console.error('Job failed with error:', { result, errorMessage })
    throw new Error(`Job failed: ${errorMessage}`)
  }

  // Handle success case
  if (result.status === 'success') {
    let urls: string[] = []
    
    console.log('Success result structure:', {
      hasUrl: 'url' in result,
      hasUrls: 'urls' in result,
      hasFiles: 'files' in result,
      urlValue: result.url,
      resultKeys: Object.keys(result)
    })

    // Check for different possible URL fields
    if (result.urls && Array.isArray(result.urls)) {
      console.log('Found urls array in result')
      urls = result.urls
    } else if (result.files && Array.isArray(result.files)) {
      console.log('Found files array in result')
      urls = result.files
    } else if (result.url) {
      console.log('Found single URL in result:', result.url)
      // Check if the path (not query params) ends with .json
      const urlPath = new URL(result.url).pathname
      console.log('URL path:', urlPath)
      
      if (urlPath.toLowerCase().endsWith('.json')) {
        console.log('URL path ends with .json, fetching content...')
        const jsonResponse = await fetch(result.url)
        if (!jsonResponse.ok) {
          const errorText = await jsonResponse.text()
          console.error('Failed to fetch JSON content:', {
            status: jsonResponse.status,
            statusText: jsonResponse.statusText,
            error: errorText
          })
          throw new Error(`Failed to fetch JSON result: ${errorText}`)
        }
        const jsonText = await jsonResponse.text()
        console.log('Raw JSON response:', jsonText)
        try {
          const jsonResult = JSON.parse(jsonText)
          if (Array.isArray(jsonResult)) {
            urls = jsonResult
          } else if (jsonResult.urls && Array.isArray(jsonResult.urls)) {
            urls = jsonResult.urls
          } else if (jsonResult.files && Array.isArray(jsonResult.files)) {
            urls = jsonResult.files
          } else if (typeof jsonResult === 'object') {
            // If it's an object with a URL field
            urls = [jsonResult.url || result.url]
          } else {
            console.error('Unexpected JSON structure:', jsonResult)
            urls = [result.url]
          }
          console.log('Parsed URLs array:', urls)
        } catch (e) {
          console.error('Failed to parse JSON response:', e)
          // Fallback to using the original URL
          urls = [result.url]
        }
      } else {
        console.log('URL path does not end with .json, using directly')
        urls = [result.url]
      }
    } else {
      console.error('No URL or URLs found in success result:', result)
      throw new Error('Success response contained no URLs')
    }
    
    console.log('URLs before validation:', urls)
    
    // Validate that all URLs have valid image extensions
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    const validUrls = urls.filter(url => {
      if (!url) {
        console.log('Found null or undefined URL in array')
        return false
      }
      try {
        const urlPath = new URL(url).pathname
        const lowercaseUrl = urlPath.toLowerCase()
        const isValid = validExtensions.some(ext => lowercaseUrl.endsWith(ext))
        console.log(`URL validation: ${url}\nPath: ${urlPath} -> ${isValid}`)
        return isValid
      } catch (e) {
        console.error('Invalid URL format:', url, e)
        return false
      }
    })

    console.log('Valid URLs after filtering:', validUrls)

    if (validUrls.length === 0) {
      console.error('No valid image URLs found in response. URLs received:', urls)
      throw new Error('No valid image URLs found in response')
    }
    
    return {
      status: result.status,
      urls: validUrls
    }
  }

  // If job is still working or has another status, return without URLs
  console.log('Job not yet complete. Current status:', result.status)
  return {
    status: result.status
  }
}

export const convertPDFToImage = async (pdfData: Uint8Array): Promise<string[]> => {
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
  console.log('PDF.co API key present:', !!pdfCoApiKey)
  
  if (!pdfCoApiKey) {
    throw new Error('PDF.co API key is not configured')
  }

  // Create form data for file upload
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('file', blob, 'document.pdf')

  // First, upload the file to PDF.co
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

  // Then convert the uploaded file to PNG asynchronously
  console.log('Starting async PDF to PNG conversion...')
  const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: uploadResult.url,
      pages: "1-",  // Convert all pages
      async: true   // Use async processing
    })
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

  const pdfResult = await pdfResponse.json()
  console.log('Async conversion started:', pdfResult)

  if (!pdfResult.jobId) {
    throw new Error('No jobId returned from PDF conversion')
  }

  // Poll for job completion
  let jobInfo;
  let attempts = 0;
  const maxAttempts = 30; // Maximum 5 minutes (30 attempts * 10 seconds)
  
  console.log('Starting polling loop for job completion...')
  do {
    console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`)
    await sleep(10000) // Wait 10 seconds between checks
    jobInfo = await checkJobStatus(pdfResult.jobId, pdfCoApiKey)
    console.log(`Poll result - Status: ${jobInfo.status}, Has URLs: ${!!jobInfo.urls}`)
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('PDF conversion timed out after 5 minutes')
    }
  } while (jobInfo.status === 'working')

  console.log('Polling complete. Final status:', jobInfo.status)

  if (jobInfo.status !== 'success') {
    throw new Error(`PDF conversion failed with status: ${jobInfo.status}`)
  }

  if (!jobInfo.urls || !jobInfo.urls.length) {
    throw new Error('No URLs returned from successful job result')
  }

  return jobInfo.urls
}