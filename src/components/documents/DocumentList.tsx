import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentItem } from "./DocumentItem"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentEmbedding {
  id: string
  filename: string
  content: string | null
  created_at: string
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
        .limit(10) // Limit to 10 most recent documents

      if (error) {
        console.error('Error fetching documents:', error)
        throw error
      }
      
      console.log('Documents fetched successfully:', data?.length || 0, 'documents')
      return data as DocumentEmbedding[]
    }
  })

  const [processingDocIds, setProcessingDocIds] = useState<string[]>([])

  const handleProcessingStart = (id: string) => {
    setProcessingDocIds(prev => [...prev, id])
  }

  const handleProcessingEnd = (id: string) => {
    setProcessingDocIds(prev => prev.filter(docId => docId !== id))
  }

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
        ) : documents?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No documents uploaded yet
          </p>
        ) : (
          <div className="space-y-4">
            {documents?.map((doc) => (
              <DocumentItem
                key={doc.id}
                {...doc}
                isProcessing={processingDocIds.includes(doc.id)}
                onProcessingStart={handleProcessingStart}
                onProcessingEnd={handleProcessingEnd}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}