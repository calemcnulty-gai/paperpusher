import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

interface DocumentItemProps {
  id: string
  filename: string
  created_at: string
  content: string | null
  isProcessing: boolean
  onProcessingStart: (id: string) => void
  onProcessingEnd: (id: string) => void
}

export const DocumentItem = ({
  id,
  filename,
  created_at,
  content,
  isProcessing,
  onProcessingStart,
  onProcessingEnd
}: DocumentItemProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleRetryProcessing = async () => {
    console.log('Retrying processing for document:', id)
    onProcessingStart(id)
    
    try {
      const { error } = await supabase.functions.invoke('process-pdf', {
        body: { document_id: id }
      })

      if (error) {
        console.error('Retry processing error:', error)
        throw error
      }

      console.log('Retry processing triggered successfully')
      await queryClient.invalidateQueries({ queryKey: ['documents'] })

      toast({
        title: "Processing started",
        description: "The document is being processed. This may take a few moments."
      })
    } catch (error) {
      console.error('Error in retry processing:', error)
      toast({
        title: "Processing failed",
        description: "There was an error processing the document. Please try again.",
        variant: "destructive"
      })
    } finally {
      onProcessingEnd(id)
      console.log('Retry processing completed for:', id)
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