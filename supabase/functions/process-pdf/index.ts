import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();
    console.log('Processing document:', document_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Get the PDF file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('product_docs')
      .download(document.file_path);

    if (fileError || !fileData) {
      throw new Error(`Failed to download file: ${fileError?.message}`);
    }

    // Convert PDF to base64
    const base64File = await fileData.arrayBuffer().then(buffer => 
      btoa(String.fromCharCode(...new Uint8Array(buffer)))
    );

    // Analyze PDF with GPT-4 Vision
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a product catalog analyzer. Extract product information from the provided document."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product catalog PDF and extract the following information in JSON format: product names, product numbers, colors, sizes, and any other relevant product details. Format the response as a JSON array of products."
              },
              {
                type: "image_url",
                image_url: `data:application/pdf;base64,${base64File}`
              }
            ]
          }
        ]
      })
    });

    const analysisResult = await openAIResponse.json();
    console.log('OpenAI Analysis Result:', analysisResult);

    let extractedProducts = [];
    try {
      // Parse the response content as JSON
      const content = analysisResult.choices[0].message.content;
      extractedProducts = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      extractedProducts = [];
    }

    // Create products from extracted information
    for (const product of extractedProducts) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          product_number: product.product_number,
          color: product.color,
          size: product.size,
          document_id: document_id,
          processing_status: 'completed',
          extracted_metadata: product
        })
        .select()
        .single();

      if (productError) {
        console.error('Error creating product:', productError);
      } else {
        console.log('Created product:', newProduct);
      }
    }

    // Update document status
    await supabase
      .from('document_embeddings')
      .update({
        content: JSON.stringify(extractedProducts),
        metadata: {
          processed: true,
          product_count: extractedProducts.length,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', document_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed successfully',
        products: extractedProducts
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});