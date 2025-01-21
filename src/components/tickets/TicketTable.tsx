import { useState, useEffect } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TicketStatus, TicketPriority } from "@/types/tickets"
import { TicketDetailsModal } from "./TicketDetailsModal"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { fetchProfiles } from "@/store/profilesSlice"
import { AppDispatch } from "@/store"
import { TicketTableHeader } from "./TicketTableHeader"
import { TicketRow } from "./TicketRow"
import { Profile } from "@/types/profiles"

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

type TicketTableProps = {
  tickets: Ticket[] | null
  isLoading: boolean
  canEdit: boolean
}

export function TicketTable({ tickets, isLoading, canEdit }: TicketTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const profiles = useSelector((state: RootState) => state.profiles.profiles)
  const agents = profiles
    .filter(profile => profile.role === 'agent' || profile.role === 'admin') as Profile[]
  
  useEffect(() => {
    console.log("Dispatching fetchProfiles")
    dispatch(fetchProfiles())
  }, [dispatch])

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
      const assignedTo = newAssigneeId === "unassigned" ? null : newAssigneeId

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
        <TicketTableHeader />
        <TableBody>
          {tickets?.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              agents={agents}
              canEdit={canEdit}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </TableBody>
      </Table>

      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        canReply={canEdit}
      />
    </div>
  )
}