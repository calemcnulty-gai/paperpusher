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
  const systemPrompt = `You are a JSON generation assistant. You ONLY output valid JSON according to this exact schema:
${JSON.stringify(schema, null, 2)}

CRITICAL INSTRUCTIONS:
1. Return ONLY the JSON object. No markdown, no code blocks, no explanations.
2. Any text outside the JSON object is a mistake.
3. If uncertain about a value, use null instead of omitting the field.
4. The JSON must be valid - all strings quoted, no trailing commas.
5. Numbers should be plain numbers without currency symbols.
6. For prices:
   - wholesale_price is the cost to the retailer
   - retail_price is the suggested selling price to customers
   - Both should be numbers only, no currency symbols
   - If only one price is found, use it as wholesale_price
7. Arrays and nested objects are allowed in specifications and extracted_metadata.`

  console.log('\nSystem Prompt:')
  console.log('='.repeat(80))
  console.log(systemPrompt)
  console.log('='.repeat(80))

  // Log the user prompt
  const userPrompt = `Extract product data from this image and return ONLY a JSON object matching this schema:
${JSON.stringify(schema, null, 2)}

Remember:
- Return ONLY the JSON object
- No additional text or formatting
- Every field must be present
- Use null for missing values
- Extract both wholesale and retail prices if available
- If only one price is found, use it as wholesale_price`

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
  
  console.log('\nSending request to OpenAI API...')
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
    console.error('OpenAI API Error:', {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      error: errorText
    })
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
    
    // Try to isolate the JSON object if GPT occasionally wraps or adds text
    const jsonMatch = content.match(/\{[\s\S]*?\}(?=\s*$)/)
    if (!jsonMatch) {
      console.error('No JSON object found in response')
      throw new Error('No JSON object found in response')
    }
    
    const jsonStr = jsonMatch[0].trim()
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
}