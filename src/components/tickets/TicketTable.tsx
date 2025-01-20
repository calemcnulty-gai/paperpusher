import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TicketStatus, TicketPriority } from "@/types/tickets"
import { TicketStatusBadge } from "./TicketStatusBadge"
import { TicketPriorityBadge } from "./TicketPriorityBadge"

type Ticket = {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  customer: { full_name: string; role: string } | null
  assignee: { full_name: string } | null
  created_at: string
}

type TicketTableProps = {
  tickets: Ticket[] | null
  isLoading: boolean
  canEdit: boolean
}

export function TicketTable({ tickets, isLoading, canEdit }: TicketTableProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticketId)

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

  const handlePriorityChange = async (ticketId: string, newPriority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ priority: newPriority })
        .eq("id", ticketId)

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets?.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.subject}</TableCell>
              <TableCell>
                {canEdit ? (
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value as TicketStatus)}
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
                ) : (
                  <TicketStatusBadge status={ticket.status} />
                )}
              </TableCell>
              <TableCell>
                {canEdit ? (
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => handlePriorityChange(ticket.id, value as TicketPriority)}
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
                ) : (
                  <TicketPriorityBadge priority={ticket.priority} />
                )}
              </TableCell>
              <TableCell>{ticket.customer?.full_name}</TableCell>
              <TableCell>{ticket.assignee?.full_name || "Unassigned"}</TableCell>
              <TableCell>
                {format(new Date(ticket.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}