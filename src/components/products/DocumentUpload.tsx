import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload } from "lucide-react"

interface DocumentUploadProps {
  productId: string
}

export function DocumentUpload({ productId }: DocumentUploadProps) {
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
      console.log('Uploading document for product:', productId)
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${productId}/${crypto.randomUUID()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('product_docs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document embedding record
      const { error: dbError } = await supabase
        .from('document_embeddings')
        .insert({
          filename: file.name,
          file_path: filePath,
          product_id: productId,
        })

      if (dbError) throw dbError

      toast({
        title: "Document uploaded",
        description: "The document has been uploaded successfully"
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
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
        id={`file-upload-${productId}`}
        disabled={isUploading}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => document.getElementById(`file-upload-${productId}`)?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
    </div>
  )
}