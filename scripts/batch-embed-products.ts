import { createClient } from '@supabase/supabase-js'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('Generating embedding for text:', text.substring(0, 100) + '...')
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

async function main() {
  // Initialize clients
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
  })

  const index = pinecone.index(process.env.PINECONE_INDEX ?? 'paperpusher')

  // Get all products
  console.log('Fetching all products...')
  const { data: products, error } = await supabase
    .from('products')
    .select('*')

  if (error) throw error
  if (!products || products.length === 0) {
    console.log('No products found')
    return
  }

  console.log(`Found ${products.length} products`)

  // Process in batches of 100
  const batchSize = 100
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(products.length / batchSize)}`)

    // Generate embeddings in parallel
    const embeddings = await Promise.all(
      batch.map(async (product) => {
        const textToEmbed = [
          product.name,
          product.description,
          product.brand,
          product.category,
          product.material,
          product.color,
          product.season
        ].filter(Boolean).join(' ')

        return generateEmbedding(textToEmbed)
      })
    )

    // Prepare batch upsert
    const upsertBatch = batch.map((product, idx) => {
      // Create metadata object with non-null values
      const metadata: Record<string, string | number | boolean> = {
        name: product.name || '',
        sku: product.sku || '',
      }

      // Add optional fields only if they exist
      if (product.description) metadata.description = product.description
      if (product.brand) metadata.brand = product.brand
      if (product.category) metadata.category = product.category
      if (product.material) metadata.material = product.material
      if (product.color) metadata.color = product.color
      if (product.season) metadata.season = product.season
      if (product.wholesale_price) metadata.wholesale_price = product.wholesale_price
      if (product.retail_price) metadata.retail_price = product.retail_price

      return {
        id: product.id,
        values: embeddings[idx],
        metadata
      }
    })

    // Upsert to Pinecone
    await index.upsert(upsertBatch)
    console.log(`Batch ${i / batchSize + 1} complete`)
  }

  console.log('All products processed successfully')
}

main().catch(console.error) 