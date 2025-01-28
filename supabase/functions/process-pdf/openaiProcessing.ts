import { OpenAIResponse, ProductData } from './types.ts'

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
   - Cover/intro pages: Will have brand logo/name but no product prices
   - Product pages: Will have shoe images with specific details and prices
7. Brand Handling:
   - Document filename "${filename}" likely contains either:
     * The full brand name
     * An abbreviation of the brand
   - Strongly prefer any brand name or abbreviation that appears in "${filename}"
   - Brand is also shown prominently on cover/intro pages
   - Brand name should be extracted exactly as shown
   - Do not confuse material types for brand names
   - Do not confuse product names for brand names
8. Product Details:
   - Name: The model/style name of the shoe
   - Material: Type of material used
   - SKU: ONLY use product codes visible in the image (e.g., "2034 014")
   - NEVER generate random SKUs - if no SKU is visible, set to null
   - Prices must be numbers only, no currency symbols
9. Cover Pages:
   - Set name, sku, prices to null
   - Focus on capturing the exact brand name
   - Store any brand taglines/info in extracted_metadata`

  console.log('System Prompt: ' + systemPrompt)

  // Log the user prompt
  const userPrompt = `Analyze this catalog page and return ONLY a JSON object matching this schema:
${JSON.stringify(schema, null, 2)}

Remember:
- First determine if this is a cover/intro page or product page
- Document filename "${filename}" likely contains:
  * Either the full brand name or an abbreviation
- Cover/intro pages:
  * Will show brand name/logo prominently
  * Set name, sku, prices to null
  * Capture exact brand name as shown
  * Strongly prefer any brand name or abbreviation found in "${filename}"
  * Store brand details in extracted_metadata
- Product pages:
  * Must have shoe image with details
  * Name is the model/style name
  * Material goes in material field, not name or brand
  * SKU must be a visible product code - NEVER generate random SKUs
  * If no SKU is visible in the image, set it to null
  * Extract prices as numbers only
- For any page:
  * Return ONLY the JSON object
  * No additional text or formatting
  * Every field must be present
  * Use null for missing values`

  console.log('\nUser Prompt: ' + userPrompt)
  
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
  
  console.log('Full OpenAI Request Payload: ' + JSON.stringify(requestPayload, null, 2))
  
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
      console.log('OpenAI Response: ' + JSON.stringify(analysisResult, null, 2))
      console.log('Status:', openAIResponse.status)
      console.log('Raw content:', analysisResult.choices[0].message.content)

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
        
        console.log('\nExtracted JSON string: ' + jsonStr)
        
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
        
        console.log('Final parsed product data: ' + JSON.stringify(result, null, 2))
        
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