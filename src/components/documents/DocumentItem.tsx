import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

interface DocumentItemProps {
  id: string
  filename: string
  file_path: string
  created_at: string
  content: string | null
  isProcessing: boolean
  onProcessingStart: (id: string) => void
  onProcessingEnd: (id: string) => void
}

export const DocumentItem = ({
  id,
  filename,
  file_path,
  created_at,
  content,
  isProcessing,
  onProcessingStart,
  onProcessingEnd
}: DocumentItemProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleRetryProcessing = async () => {
    if (isProcessing) {
      console.log('Document already processing, ignoring request:', id)
      return
    }

    console.log('Starting processing for document:', id)
    onProcessingStart(id)
    
    try {
      // First check if document is already processed
      const { data: doc } = await supabase
        .from('document_embeddings')
        .select('content')
        .eq('id', id)
        .single()

      if (doc?.content) {
        console.log('Document already processed:', id)
        toast({
          title: "Already processed",
          description: "This document has already been processed.",
          variant: "default"
        })
        return
      }

      console.log('Invoking process-pdf function with file path:', file_path)
      const { error: processError, data: processData } = await supabase.functions.invoke('process-pdf', {
        body: { file_path: file_path }
      })

      if (processError) {
        console.error('Processing error:', processError)
        throw processError
      }

      console.log('Processing response:', processData)
      if (processData?.error === 'Document is already being processed') {
        console.log('Document is already being processed:', id)
        toast({
          title: "Processing in progress",
          description: "This document is already being processed. Please wait.",
          variant: "default"
        })
        return
      }

      console.log('Processing triggered successfully')
      // Only invalidate the specific document instead of the whole list
      await queryClient.invalidateQueries({ queryKey: ['documents', id] })

      toast({
        title: "Processing started",
        description: "The document is being processed. This may take a few moments."
      })
    } catch (error) {
      console.error('Error in processing:', error)
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "There was an error processing the document. Please try again.",
        variant: "destructive"
      })
    } finally {
      onProcessingEnd(id)
      console.log('Processing completed for:', id)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-blue-500" />
        <div>
          <p className="font-medium">{filename}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {content && (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
            Processed
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetryProcessing}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}