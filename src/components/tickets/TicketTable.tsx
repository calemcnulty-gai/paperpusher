import { useState } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TicketStatus, TicketPriority, Ticket } from "@/types/tickets"
import { TicketDetailsModal } from "./TicketDetailsModal"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { fetchProfiles } from "@/store/profilesSlice"
import { AppDispatch } from "@/store"
import { TicketTableHeader } from "./TicketTableHeader"
import { TicketRow } from "./TicketRow"
import { TicketFilters } from "./TicketFilters"
import { Profile } from "@/types/profiles"
import { useNavigate } from "react-router-dom"

type TicketTableProps = {
  tickets: Ticket[] | null
  isLoading: boolean
  canEdit: boolean
  selectedTicket?: Ticket | null
  onTicketSelect?: (ticketId: string | null) => void
}

export function TicketTable({ 
  tickets, 
  isLoading, 
  canEdit,
  selectedTicket,
  onTicketSelect 
}: TicketTableProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const profiles = useSelector((state: RootState) => state.profiles.profiles)
  const agents = profiles.filter(profile => profile.role === 'agent' || profile.role === 'admin') as Profile[]
  const navigate = useNavigate()

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

  const handleTicketClick = (ticketId: string) => {
    if (onTicketSelect) {
      onTicketSelect(ticketId)
    }
    // Update URL with ticketId
    navigate(`/tickets?ticketId=${ticketId}`, { replace: true })
  }

  const filteredTickets = tickets?.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false
    return true
  })

  return (
    <div>
      <TicketFilters
        status={statusFilter}
        priority={priorityFilter}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
      />
      
      <div className="border rounded-lg">
        <Table>
          <TicketTableHeader />
          <TableBody>
            {filteredTickets?.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                agents={agents}
                canEdit={canEdit}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onAssigneeChange={handleAssigneeChange}
                onClick={() => handleTicketClick(ticket.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <TicketDetailsModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open && onTicketSelect) {
            onTicketSelect(null)
            // Update URL to remove ticketId
            navigate('/tickets', { replace: true })
          }
        }}
        canReply={canEdit}
      />
    </div>
  )
}