import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DocumentUpload } from "@/components/documents/DocumentUpload"
import { DocumentList } from "@/components/documents/DocumentList"

export default function Documents() {
  const queryClient = useQueryClient()

  console.log('Documents component rendered')

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for document_embeddings')
    const channel = supabase
      .channel('document-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'document_embeddings' 
        },
        (payload) => {
          console.log('Real-time update received:', payload)
          // Invalidate and refetch documents when changes occur
          queryClient.invalidateQueries({ queryKey: ['documents'] })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <DocumentUpload />
      <DocumentList />
    </div>
  )
}