import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateEmbedding(text: string): Promise<number[]> {
  const openAiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openAiKey) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    console.log('Generating embedding for text:', text.substring(0, 100) + '...')
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error}`)
    }

    const result = await response.json()
    console.log('Embedding generated successfully')
    return result.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is incomplete')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get pending products
    console.log('Fetching pending products...')
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('processing_status', 'pending')
      .limit(10)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${products?.length || 0} pending products`)

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending products found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each product
    for (const product of products) {
      try {
        console.log(`Processing product ${product.id}: ${product.name}`)
        
        // Update status to processing
        await supabase
          .from('products')
          .update({ processing_status: 'processing' })
          .eq('id', product.id)

        // Combine product fields for embedding
        const textToEmbed = [
          product.name,
          product.description,
          product.brand,
          product.category,
          product.material,
          product.color,
          product.season
        ].filter(Boolean).join(' ')

        // Generate embedding
        const embedding = await generateEmbedding(textToEmbed)

        // Update product with embedding and status
        const { error: updateError } = await supabase
          .from('products')
          .update({
            embedding,
            processing_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (updateError) {
          throw updateError
        }

        console.log(`Successfully processed product ${product.id}`)

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error)
        
        // Update product status to failed
        await supabase
          .from('products')
          .update({
            processing_status: 'failed',
            processing_error: error.message
          })
          .eq('id', product.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${products.length} products`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-product-embeddings function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})