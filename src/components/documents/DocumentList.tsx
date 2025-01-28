import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentItem } from "./DocumentItem"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentEmbedding {
  id: string
  filename: string
  file_path: string
  content: string | null
  created_at: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_error?: string | null
  pages_processed?: number
  total_pages?: number
}

export const DocumentList = () => {
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      console.log('Fetching documents from Supabase')
      const { data, error } = await supabase
        .from('document_embeddings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        throw error
      }
      
      console.log('Documents fetched successfully:', data?.length || 0, 'documents')
      return data as DocumentEmbedding[]
    },
    // Safely check if any documents are processing
    refetchInterval: (data) => {
      if (!data || !Array.isArray(data)) {
        console.log('No documents data available for refetch check')
        return false
      }
      
      const hasProcessingDocs = data.some(doc => 
        doc.processing_status === 'processing' || 
        doc.processing_status === 'pending'
      )
      
      console.log('Documents processing status:', hasProcessingDocs ? 'Processing' : 'Idle')
      return hasProcessingDocs ? 5000 : false
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load documents: {error instanceof Error ? error.message : 'Unknown error occurred'}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !documents || documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                {...doc}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}