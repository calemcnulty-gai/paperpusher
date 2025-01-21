import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TicketMessageList } from "./TicketMessageList"
import { TicketReplyForm } from "./TicketReplyForm"
import { TicketMetadata } from "./TicketMetadata"
import { Ticket } from "@/types/tickets"
import { useTicketOperations } from "@/hooks/useTicketOperations"
import { useState } from "react"

interface TicketDetailsModalProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TicketDetailsModal({ ticket, open, onOpenChange }: TicketDetailsModalProps) {
  const [reply, setReply] = useState("")
  
  // Move hooks to top level
  const {
    isSubmitting,
    handleReply,
    updateStatus,
    updatePriority,
    updateProject,
  } = useTicketOperations(ticket?.id || '') // Provide a default value

  // Fetch available projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code")
        .order("name")
      
      if (error) throw error
      return data
    },
    enabled: open && !!ticket // Only fetch when modal is open and ticket exists
  })

  const handleSubmitReply = async (isInternal: boolean = false) => {
    if (!reply.trim() || !ticket) return
    
    const success = await handleReply(reply, isInternal)
    if (success) {
      setReply("")
    }
  }

  // Return null after hooks are called
  if (!open || !ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>
            View and manage ticket information
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 space-y-4 overflow-hidden">
          <TicketMetadata
            ticket={ticket}
            projects={projects}
            onStatusChange={updateStatus}
            onPriorityChange={updatePriority}
            onProjectChange={updateProject}
          />

          <div className="flex-1 overflow-y-auto">
            <TicketMessageList ticketId={ticket.id} />
          </div>

          <TicketReplyForm
            value={reply}
            onChange={setReply}
            onSubmit={handleSubmitReply}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}