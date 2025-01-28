-- Add processing status fields to document_embeddings table
ALTER TABLE document_embeddings 
ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_error text,
ADD COLUMN IF NOT EXISTS pages_processed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pages integer DEFAULT 0; 