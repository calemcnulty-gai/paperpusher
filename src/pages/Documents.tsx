import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Documents() {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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
    <div className="container mx-auto py-6">
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
    </div>
  )
}