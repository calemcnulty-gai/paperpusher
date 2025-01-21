import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { TicketStatus, TicketPriority } from "@/types/tickets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      onClose()
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
      <DialogContent className="max-w-2xl">
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
                {ticket.customer?.email && (
                  <a 
                    href={`mailto:${ticket.customer.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {ticket.customer.email}
                  </a>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm">{ticket.assignee?.full_name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm">{format(new Date(ticket.created_at), "MMM d, yyyy")}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.description || "No description provided"}</p>
            </div>

            {canReply && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Reply to ticket</p>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply here..."
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleSubmitReply} 
                  className="mt-2"
                  disabled={!reply.trim() || isSubmitting}
                >
                  Send Reply
                </Button>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}