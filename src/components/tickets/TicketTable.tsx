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
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { useEffect } from "react"
import { fetchProfiles } from "@/store/profilesSlice"
import { AppDispatch } from "@/store"

type Ticket = {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  customer: { full_name: string; role: string } | null
  assignee: { id: string; full_name: string } | null
  created_at: string
}

type TicketTableProps = {
  tickets: Ticket[] | null
  isLoading: boolean
  canEdit: boolean
}

const UNASSIGNED_VALUE = "unassigned"

export function TicketTable({ tickets, isLoading, canEdit }: TicketTableProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const profiles = useSelector((state: RootState) => state.profiles.profiles)
  const agents = profiles.filter(profile => profile.role === 'agent' || profile.role === 'admin')
  
  useEffect(() => {
    console.log("Dispatching fetchProfiles")
    dispatch(fetchProfiles())
  }, [dispatch])

  // Debug logs
  useEffect(() => {
    console.log("Current profiles in Redux store:", profiles)
    console.log("Filtered agents:", agents)
  }, [profiles, agents])

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

  const handleAssigneeChange = async (ticketId: string, newAssigneeId: string) => {
    try {
      // If the value is UNASSIGNED_VALUE, set assigned_to to null
      const assignedTo = newAssigneeId === UNASSIGNED_VALUE ? null : newAssigneeId

      const { error } = await supabase
        .from("tickets")
        .update({ assigned_to: assignedTo })
        .eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket assignee updated successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    } catch (error) {
      console.error("Error updating ticket assignee:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket assignee",
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
              <TableCell>
                {canEdit ? (
                  <Select
                    value={ticket.assignee?.id || UNASSIGNED_VALUE}
                    onValueChange={(value) => handleAssigneeChange(ticket.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name || agent.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  ticket.assignee?.full_name || "Unassigned"
                )}
              </TableCell>
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