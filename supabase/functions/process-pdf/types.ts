export interface PDFProcessingResponse {
  url?: string;
  status: string;
  message?: string;
  jobId?: string;
  error?: boolean;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ProductData {
  name: string;
  sku: string;
  brand: string | null;
  category: string;
  size: string | null;
  color: string | null;
  material: string | null;
  wholesale_price: number | null;
  retail_price: number | null;
  product_number: string | null;
  description: string | null;
  specifications: Record<string, any>;
  season: string;
  extracted_metadata: Record<string, any>;
}