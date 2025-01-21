import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { TicketMessageList } from "./TicketMessageList"
import { TicketReplyForm } from "./TicketReplyForm"
import { TicketMetadata } from "./TicketMetadata"
import { Ticket, TicketStatus, TicketPriority } from "@/types/tickets"

type TicketDetailsModalProps = {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
  canReply: boolean
}

export function TicketDetailsModal({ ticket, isOpen, onClose, canReply }: TicketDetailsModalProps) {
  const [reply, setReply] = useState("")
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<TicketStatus | null>(null)
  const [priority, setPriority] = useState<TicketPriority | null>(null)
  const queryClient = useQueryClient()

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
    }
  })

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["ticket-messages", ticket?.id],
    queryFn: async () => {
      if (!ticket) return []
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          id,
          message,
          created_at,
          sender:profiles!ticket_messages_sender_id_fkey(
            full_name,
            role
          )
        `)
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!ticket
  })

  const handleSubmitReply = async () => {
    if (!ticket || !reply.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to reply",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          message: reply.trim(),
          is_internal: false,
          sender_id: user.id
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Reply sent successfully",
      })
      
      setReply("")
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticket.id] })
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send reply",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return
    setStatus(newStatus)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket status",
      })
    }
  }

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return
    setPriority(newPriority)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority })
        .eq("id", ticket.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket priority updated successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    } catch (error) {
      console.error("Error updating ticket priority:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket priority",
      })
    }
  }

  const handleProjectChange = async (projectId: string | null) => {
    if (!ticket) return
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ project_id: projectId })
        .eq("id", ticket.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket project updated successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    } catch (error) {
      console.error("Error updating ticket project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket project",
      })
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {ticket.project_ticket_key ? `[${ticket.project_ticket_key}] ` : ''}{ticket.subject}
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <TicketMetadata
              status={status || ticket.status}
              priority={priority || ticket.priority}
              projectId={ticket.project_id}
              customer={ticket.customer}
              assignee={ticket.assignee}
              createdAt={ticket.created_at}
              projects={projects}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onProjectChange={handleProjectChange}
            />
            
            <div className="mt-4">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {ticket.description || "No description provided"}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Messages</p>
              <TicketMessageList 
                messages={messages} 
                isLoading={isLoadingMessages} 
              />
            </div>

            <TicketReplyForm
              reply={reply}
              setReply={setReply}
              onSubmit={handleSubmitReply}
              isSubmitting={isSubmitting}
              canReply={canReply}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}