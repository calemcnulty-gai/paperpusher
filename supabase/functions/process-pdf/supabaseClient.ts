import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const initSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is incomplete');
  }

  return createClient(supabaseUrl, supabaseKey);
};

export const downloadAndConvertPDF = async (supabase: any, filePath: string): Promise<Uint8Array> => {
  console.log('Downloading PDF from storage bucket:', filePath);
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('product_docs')
    .download(filePath);

  if (fileError) {
    console.error('Storage error when downloading file:', fileError);
    throw fileError;
  }

  if (!fileData) {
    console.error('No file data received from storage');
    throw new Error('File data is empty');
  }

  console.log('Successfully downloaded PDF file');
  return new Uint8Array(await fileData.arrayBuffer());
};

export const updateDocumentContent = async (supabase: any, documentId: string, content: string) => {
  console.log('Updating document with analysis results...');
  const { error: updateError } = await supabase
    .from('document_embeddings')
    .update({
      content: content,
      metadata: {
        processed: true,
        processed_at: new Date().toISOString(),
        model_used: "gpt-4-vision-preview",
        pages_processed: 1
      }
    })
    .eq('id', documentId);

  if (updateError) {
    console.error('Error updating document with analysis:', updateError);
    throw updateError;
  }

  console.log('Document processing completed successfully');
};