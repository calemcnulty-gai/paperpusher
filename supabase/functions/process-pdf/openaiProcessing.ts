import { OpenAIResponse, ProductData } from './types.ts'

// Helper function to get color code
function getColorCode(color: string): string {
  if (!color) return ''
  const colorMap: { [key: string]: string } = {
    'black': 'BLK',
    'blue': 'BLU',
    'brown': 'BRN',
    'grey': 'GRY',
    'gray': 'GRY',
    'green': 'GRN',
    'navy': 'NAV',
    'orange': 'ORG',
    'pink': 'PNK',
    'purple': 'PRP',
    'red': 'RED',
    'white': 'WHT',
    'yellow': 'YLW',
    'beige': 'BEI',
    'tan': 'TAN',
    'khaki': 'KHK',
    'kaki': 'KHK',
    'silver': 'SLV',
    'gold': 'GLD',
    'multi': 'MLT'
  }
  
  const normalizedColor = color.toLowerCase().trim()
  // Try exact match first
  if (normalizedColor in colorMap) {
    return colorMap[normalizedColor]
  }
  
  // Try to find partial match
  for (const [key, code] of Object.entries(colorMap)) {
    if (normalizedColor.includes(key)) {
      return code
    }
  }
  
  // If no match found, take first 3 letters of color
  return normalizedColor.slice(0, 3).toUpperCase()
}

// Helper function to generate a SKU from a name
function generateSkuFromName(name: string): string {
  // Remove special characters and spaces, convert to uppercase
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  
  // Take first 12 characters (or all if less than 12)
  const namePrefix = cleanName.slice(0, 12)
  
  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  
  return `${namePrefix}${randomNum}`
}

export async function analyzeImageWithOpenAI(imageUrl: string, filename: string): Promise<ProductData> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
  console.log('\n=== Starting OpenAI Analysis ===')
  console.log('Processing:', filename)
  console.log('Image URL:', imageUrl)
  console.log('OpenAI API key present:', !!openAiApiKey)
  
  if (!openAiApiKey) {
    throw new Error('OpenAI API key is not configured')
  }

  const schema = {
    name: "",              // Product name/title
    sku: "",              // Product SKU or ID
    brand: "",            // Brand name
    category: "shoes",    // Product category
    size: "",            // Size information
    color: "",           // Color information
    material: "",        // Material information
    wholesale_price: 0,  // Wholesale price as number only
    retail_price: 0,     // Retail price as number only
    product_number: "",   // Product model/number
    description: "",     // Product description
    specifications: {},  // Additional specs
    season: "all",      // Season information
    extracted_metadata: {} // Any other data
  }

  // Log the system prompt
  const systemPrompt = `You are a JSON generation assistant analyzing shoe catalog pages. You ONLY output valid JSON according to this exact schema:
${JSON.stringify(schema, null, 2)}

CRITICAL INSTRUCTIONS:
1. Return ONLY the JSON object. No markdown, no code blocks, no explanations.
2. Any text outside the JSON object is a mistake.
3. If uncertain about a value, use null instead of omitting the field.
4. The JSON must be valid - all strings quoted, no trailing commas.
5. Numbers should be plain numbers without currency symbols.
6. Page Type Analysis:
   - Cover/intro pages: Will have brand info but no specific products
   - Product pages: Will always have shoe images and product details
7. For Cover Pages:
   - Set name, sku, and prices to null
   - Focus on capturing the brand name accurately
   - Store any additional brand info in extracted_metadata
8. For Product Pages:
   - Product must have visible shoe image to be considered valid
   - Look for SKU/product code near product details
   - Prices should be numbers only, no currency symbols
   - If only one price found, use it as wholesale_price
9. SKU Rules:
   - Look for existing product codes or SKUs in the image
   - SKUs are often found near product details or prices
   - Only generate a SKU if you cannot find one in the image
   - Generated SKUs should be based on visible product information`

  console.log('\nSystem Prompt:')
  console.log('='.repeat(80))
  console.log(systemPrompt)
  console.log('='.repeat(80))

  // Log the user prompt
  const userPrompt = `Analyze this catalog page and return ONLY a JSON object matching this schema:
${JSON.stringify(schema, null, 2)}

Remember:
- First determine if this is a cover page or product page
- Cover pages:
  * Will have brand information but no specific products
  * Set name, sku, prices to null
  * Focus on capturing brand name and any brand details
- Product pages:
  * Must have visible shoe image to be valid
  * Extract all product details (name, SKU, prices, etc.)
  * Look for SKU/product code near product details
- For any page:
  * Return ONLY the JSON object
  * No additional text or formatting
  * Every field must be present
  * Use null for missing values
  * Numbers only for prices, no currency symbols`

  console.log('\nUser Prompt:')
  console.log('='.repeat(80))
  console.log(userPrompt)
  console.log('='.repeat(80))
  
  const requestPayload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0,
    presence_penalty: 0,
    frequency_penalty: 0
  }
  
  console.log('\nFull Request Payload:')
  console.log('='.repeat(80))
  console.log(JSON.stringify(requestPayload, null, 2))
  console.log('='.repeat(80))
  
  const maxRetries = 3
  const retryDelay = 2000 // 2 seconds
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\nAttempting OpenAI API call (attempt ${attempt}/${maxRetries})...`)
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      })

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text()
        console.error(`OpenAI API Error on attempt ${attempt}:`, {
          status: openAIResponse.status,
          statusText: openAIResponse.statusText,
          error: errorText
        })

        // Check if this is a timeout or image URL error that might resolve with retry
        const errorJson = JSON.parse(errorText)
        if (
          errorJson?.error?.code === 'invalid_image_url' ||
          errorJson?.error?.message?.includes('Timeout') ||
          openAIResponse.status === 429 || // Rate limit
          (openAIResponse.status >= 500 && openAIResponse.status <= 599) // Server errors
        ) {
          lastError = new Error(errorJson?.error?.message || errorText)
          if (attempt < maxRetries) {
            const delay = retryDelay * attempt // Exponential backoff
            console.log(`Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        throw new Error(`OpenAI API error: ${errorText}`)
      }

      const analysisResult = await openAIResponse.json()
      console.log('\nOpenAI Response:')
      console.log('='.repeat(80))
      console.log('Status:', openAIResponse.status)
      console.log('Headers:', Object.fromEntries(openAIResponse.headers))
      console.log('Raw content:', analysisResult.choices[0].message.content)
      console.log('='.repeat(80))

      // Parse the JSON content with robust error handling
      try {
        const content = analysisResult.choices[0].message.content || ''
        console.log('\nRaw content to parse:', content)
        
        // First try to extract JSON from markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/)
        let jsonStr = ''
        
        if (codeBlockMatch && codeBlockMatch[1]) {
          console.log('Found JSON in code block')
          jsonStr = codeBlockMatch[1].trim()
        } else {
          // Fallback to looking for just the JSON object
          console.log('No code block found, looking for raw JSON object')
          const jsonMatch = content.match(/\{[\s\S]*?\}(?=\s*$)/)
          if (!jsonMatch) {
            console.error('No JSON object found in response')
            throw new Error('No JSON object found in response')
          }
          jsonStr = jsonMatch[0].trim()
        }
        
        console.log('\nExtracted JSON string:')
        console.log('='.repeat(80))
        console.log(jsonStr)
        console.log('='.repeat(80))
        
        let productData
        try {
          productData = JSON.parse(jsonStr)
        } catch (parseError) {
          // If initial parse fails, try to clean the string
          console.warn('Initial JSON parse failed, attempting to clean string')
          const cleanStr = jsonStr
            .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
            .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
            .replace(/\n/g, ' ')            // Remove newlines
            .replace(/,\s*}/g, '}')         // Remove trailing commas
            .replace(/,\s*]/g, ']')         // Remove trailing commas in arrays
          
          try {
            productData = JSON.parse(cleanStr)
          } catch (secondError) {
            console.error('JSON parse error after cleaning:', secondError)
            console.error('Failed JSON string:', cleanStr)
            throw new Error('Failed to parse JSON response')
          }
        }
        
        // Validate against schema
        const result = { ...schema }
        for (const [key, value] of Object.entries(productData)) {
          if (key in schema) {
            // Convert prices to numbers if they're strings
            if ((key === 'wholesale_price' || key === 'retail_price') && typeof value === 'string') {
              result[key] = parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0
            } else {
              result[key] = value
            }
          } else {
            // Put unknown fields in extracted_metadata
            result.extracted_metadata[key] = value
          }
        }
        
        // Ensure we have a valid SKU
        if (!result.sku || result.sku.trim() === '') {
          if (result.name && result.name.trim() !== '') {
            console.log('No SKU found, generating from name:', result.name)
            result.sku = generateSkuFromName(result.name)
            console.log('Generated SKU:', result.sku)
          } else {
            console.log('No name or SKU found, generating random SKU')
            result.sku = generateSkuFromName('PRODUCT' + Date.now())
            console.log('Generated random SKU:', result.sku)
          }
        }
        
        console.log('\nFinal parsed product data:')
        console.log('='.repeat(80))
        console.log(JSON.stringify(result, null, 2))
        console.log('='.repeat(80))
        console.log('=== End OpenAI Analysis ===\n')
        
        return result
      } catch (error) {
        console.error('Failed to process OpenAI response:', error)
        console.error('Full OpenAI response:', analysisResult)
        throw new Error(`Failed to process product data: ${error.message}`)
      }
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      console.error('All OpenAI API attempts failed. Last error:', lastError)
      throw error
    }
  }

  throw new Error('Unexpected end of OpenAI processing')
}