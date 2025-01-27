import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentItem } from "./DocumentItem"

interface DocumentEmbedding {
  id: string
  filename: string
  content: string | null
  created_at: string
}

export const DocumentList = () => {
  const { data: documents, isLoading } = useQuery({
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
        {isLoading ? (
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