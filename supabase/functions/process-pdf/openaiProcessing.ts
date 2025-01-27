import { OpenAIResponse } from './types.ts';

export async function analyzeImageWithOpenAI(imageUrl: string, filename: string): Promise<OpenAIResponse> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  console.log('Sending request to OpenAI API...');
  console.log('Image URL:', imageUrl);
  console.log('Filename:', filename);
  
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a product information extraction assistant. Extract and structure key information from product documents into a clear, organized format."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this product document titled "${filename}" and extract key information like product names, numbers, specifications, and any other relevant details. Format the information in a clear, structured way.`
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
      max_tokens: 4096
    })
  });

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    console.error('OpenAI API Error:', {
      status: openAIResponse.status,
      statusText: openAIResponse.statusText,
      error: errorText
    });
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const analysisResult = await openAIResponse.json();
  console.log('OpenAI Analysis completed successfully');
  return analysisResult;
}