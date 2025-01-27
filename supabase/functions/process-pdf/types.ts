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