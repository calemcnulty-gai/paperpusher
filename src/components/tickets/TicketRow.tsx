import { format } from "date-fns"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TicketStatus, TicketPriority } from "@/types/tickets"
import { Profile } from "@/types/profiles"
import { TicketStatusCell } from "./TicketStatusCell"
import { TicketPriorityCell } from "./TicketPriorityCell"
import { TicketAssigneeCell } from "./TicketAssigneeCell"

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

type TicketRowProps = {
  ticket: Ticket
  agents: Profile[]
  canEdit: boolean
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>
  onPriorityChange: (ticketId: string, newPriority: TicketPriority) => Promise<void>
  onAssigneeChange: (ticketId: string, newAssigneeId: string) => Promise<void>
  onClick: () => void
}

export function TicketRow({ 
  ticket, 
  agents, 
  canEdit, 
  onStatusChange, 
  onPriorityChange, 
  onAssigneeChange,
  onClick 
}: TicketRowProps) {
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={onClick}
    >
      <TableCell className="font-medium">{ticket.subject}</TableCell>
      <TicketStatusCell
        status={ticket.status}
        ticketId={ticket.id}
        canEdit={canEdit}
        onStatusChange={onStatusChange}
      />
      <TicketPriorityCell
        priority={ticket.priority}
        ticketId={ticket.id}
        canEdit={canEdit}
        onPriorityChange={onPriorityChange}
      />
      <TableCell>{ticket.customer?.full_name}</TableCell>
      <TicketAssigneeCell
        assigneeId={ticket.assignee?.id}
        agents={agents}
        ticketId={ticket.id}
        canEdit={canEdit}
        onAssigneeChange={onAssigneeChange}
      />
      <TableCell>
        {format(new Date(ticket.created_at), "MMM d, yyyy")}
      </TableCell>
      <TableCell>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          Manage
        </Button>
      </TableCell>
    </TableRow>
  )
}