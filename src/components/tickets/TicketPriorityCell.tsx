import { TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketPriority } from "@/types/tickets"
import { TicketPriorityBadge } from "./TicketPriorityBadge"

type TicketPriorityCellProps = {
  priority: TicketPriority
  ticketId: string
  canEdit: boolean
  onPriorityChange: (ticketId: string, newPriority: TicketPriority) => Promise<void>
}

export function TicketPriorityCell({ priority, ticketId, canEdit, onPriorityChange }: TicketPriorityCellProps) {
  return (
    <TableCell>
      {canEdit ? (
        <Select
          value={priority}
          onValueChange={(value) => {
            // Prevent row click when interacting with select
            event?.stopPropagation()
            onPriorityChange(ticketId, value as TicketPriority)
          }}
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
        <TicketPriorityBadge priority={priority} />
      )}
    </TableCell>
  )
}