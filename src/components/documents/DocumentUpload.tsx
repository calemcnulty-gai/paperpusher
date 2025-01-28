import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQueryClient } from "@tanstack/react-query"

// Separate function to request processing
const requestProcessing = async (filePath: string) => {
  try {
    const { error } = await supabase.functions.invoke('process-pdf', {
      body: { file_path: filePath }
    })
    
    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error requesting processing:', error)
    throw error
  }
}

export const DocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive"
      })
      return
    }

    if (file.type !== 'application/pdf') {
      console.warn('Invalid file type:', file.type)
      toast({
        title: "Invalid file type",
        description: "Only PDF files are supported",
        variant: "destructive"
      })
      return
    }

    console.log('Starting file upload:', file.name)
    setIsUploading(true)
    
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`
      
      console.log('Uploading to storage path:', filePath)
      const { error: uploadError } = await supabase.storage
        .from('product_docs')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // 2. Create database record
      const { data: doc, error: dbError } = await supabase
        .from('document_embeddings')
        .insert({
          filename: file.name,
          file_path: filePath,
          processing_status: 'pending',
          pages_processed: 0,
          total_pages: 0
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Failed to create document record: ${dbError.message}`)
      }

      // 3. Request processing
      await requestProcessing(filePath)

      // 4. Return control to UI immediately
      toast({
        title: "Document uploaded",
        description: "Processing will begin shortly. You can track the progress below."
      })

      // 5. Refresh document list
      queryClient.invalidateQueries({ queryKey: ['documents'] })

    } catch (error) {
      console.error('Error in upload process:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading the document",
        variant: "destructive"
      })

      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
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
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}