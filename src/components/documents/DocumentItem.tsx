import { Button } from "@/components/ui/button"
import { FileText, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentItemProps {
  id: string
  filename: string
  file_path: string
  created_at: string
  content: string | null
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  processing_error?: string | null
  pages_processed?: number
  total_pages?: number
}

export const DocumentItem = ({
  id,
  filename,
  file_path,
  created_at,
  content,
  processing_status,
  processing_error,
  pages_processed = 0,
  total_pages = 0
}: DocumentItemProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleRetryProcessing = async () => {
    if (processing_status === 'processing') {
      console.log('Document already processing, ignoring request:', id)
      return
    }

    console.log('Starting processing for document:', id)
    
    try {
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
    }
  }

  const getStatusColor = () => {
    switch (processing_status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = () => {
    switch (processing_status) {
      case 'completed':
        return 'Processed'
      case 'failed':
        return 'Failed'
      case 'processing':
        return total_pages > 0 
          ? `Processing (${pages_processed}/${total_pages} pages)`
          : 'Processing...'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-2">
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
          <span className={`text-sm px-2 py-1 rounded ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetryProcessing}
            disabled={processing_status === 'processing'}
          >
            {processing_status === 'processing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {processing_status === 'processing' && total_pages > 0 && (
        <div className="px-4">
          <Progress 
            value={(pages_processed / total_pages) * 100} 
            className="h-2"
          />
        </div>
      )}

      {processing_status === 'failed' && processing_error && (
        <div className="px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{processing_error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}