import { TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketStatus } from "@/types/tickets"
import { TicketStatusBadge } from "./TicketStatusBadge"

type TicketStatusCellProps = {
  status: TicketStatus
  ticketId: string
  canEdit: boolean
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>
}

export function TicketStatusCell({ status, ticketId, canEdit, onStatusChange }: TicketStatusCellProps) {
  return (
    <TableCell>
      {canEdit ? (
        <Select
          value={status}
          onValueChange={(value) => {
            // Prevent row click when interacting with select
            event?.stopPropagation()
            onStatusChange(ticketId, value as TicketStatus)
          }}
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
        <TicketStatusBadge status={status} />
      )}
    </TableCell>
  )
}