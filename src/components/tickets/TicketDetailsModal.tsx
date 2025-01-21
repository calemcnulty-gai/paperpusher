import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { TicketStatus, TicketPriority } from "@/types/tickets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { TicketMessageList } from "./TicketMessageList"
import { TicketReplyForm } from "./TicketReplyForm"

type Ticket = {
  id: string
  subject: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  customer: { full_name: string; role: string; email: string } | null
  assignee: { id: string; full_name: string } | null
  created_at: string
}

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
    } catch (error) {
      console.error("Error updating ticket priority:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket priority",
      })
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={status || ticket.status}
                  onValueChange={(value) => handleStatusChange(value as TicketStatus)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium">Priority</p>
                <Select
                  value={priority || ticket.priority}
                  onValueChange={(value) => handlePriorityChange(value as TicketPriority)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p className="text-sm">{ticket.customer?.full_name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm">{ticket.assignee?.full_name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">{new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
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