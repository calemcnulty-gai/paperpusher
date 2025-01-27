import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQueryClient } from "@tanstack/react-query"

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
      const fileExt = file.name.split('.').pop()
      const filePath = `${crypto.randomUUID()}.${fileExt}`
      
      console.log('Uploading to storage path:', filePath)
      const { error: uploadError } = await supabase.storage
        .from('product_docs')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      console.log('File uploaded successfully to storage')

      const { data: docData, error: dbError } = await supabase
        .from('document_embeddings')
        .insert({
          filename: file.name,
          file_path: filePath,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw new Error(`Failed to create document record: ${dbError.message}`)
      }

      console.log('Document record created:', docData.id)

      const { error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: { document_id: docData.id }
        })

      if (processError) {
        console.error('Processing function error:', processError)
        throw new Error(`Failed to process document: ${processError.message}`)
      }

      console.log('Processing triggered successfully')
      toast({
        title: "Document uploaded",
        description: "The document has been uploaded and is being processed"
      })

    } catch (error) {
      console.error('Error in upload process:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading the document",
        variant: "destructive"
      })

      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } finally {
      setIsUploading(false)
      console.log('Upload process completed')
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
            {isUploading ? "Processing..." : "Upload Document"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}