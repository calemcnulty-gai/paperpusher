import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload, FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"

interface DocumentEmbedding {
  id: string
  filename: string
  content: string | null
  created_at: string
  updated_at: string
}

export default function Documents() {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Fetch documents
  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_embeddings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as DocumentEmbedding[]
    }
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      console.log('Uploading document')
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('product_docs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document embedding record
      const { data: docData, error: dbError } = await supabase
        .from('document_embeddings')
        .insert({
          filename: file.name,
          file_path: filePath,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Trigger document processing
      const { error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: { document_id: docData.id }
        })

      if (processError) throw processError

      toast({
        title: "Document uploaded",
        description: "The document has been uploaded and is being processed"
      })

    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading the document",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Processing..." : "Upload Document"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDocs ? (
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
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.content ? (
                      <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                        Processed
                      </span>
                    ) : (
                      <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}