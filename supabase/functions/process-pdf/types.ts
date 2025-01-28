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
  name: string | null;
  sku: string | null;
  brand: string | null;
  category?: string;
  size?: string;
  color?: string;
  material?: string;
  wholesale_price?: number | null;
  retail_price?: number | null;
  product_number?: string;
  description?: string;
  specifications?: Record<string, any>;
  season?: string;
  extracted_metadata?: Record<string, any>;
}

export interface DocumentEmbedding {
  id: string;
  content: string | null;
  filename: string;
  file_path: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string | null;
  pages_processed?: number;
  total_pages?: number;
}

export interface ProcessingResult {
  success: boolean;
  pages_processed: number;
  products_created: number;
}