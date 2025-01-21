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
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
  canReply: boolean
}

export function TicketDetailsModal({ ticket, open, onOpenChange, canReply }: TicketDetailsModalProps) {
  const [reply, setReply] = useState("")
  const {
    isSubmitting,
    handleReply,
    updateStatus,
    updatePriority,
    updateProject,
  } = useTicketOperations(ticket.id)

  // Fetch available projects
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, code")
        .order("name")
      
      if (error) throw error
      return data
    },
  })

  const handleSubmitReply = async (isInternal: boolean = false) => {
    if (!reply.trim()) return
    
    const success = await handleReply(reply, isInternal)
    if (success) {
      setReply("")
    }
  }

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
            status={ticket.status}
            priority={ticket.priority}
            projectId={ticket.project_id}
            customer={ticket.customer}
            assignee={ticket.assignee}
            createdAt={ticket.created_at}
            projects={projects || []}
            onStatusChange={updateStatus}
            onPriorityChange={updatePriority}
            onProjectChange={updateProject}
          />

          <div className="flex-1 overflow-y-auto">
            <TicketMessageList
              messages={ticket.messages}
              isLoading={false}
            />
          </div>

          {canReply && (
            <TicketReplyForm
              reply={reply}
              setReply={setReply}
              onSubmit={handleSubmitReply}
              isSubmitting={isSubmitting}
              canReply={true}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}