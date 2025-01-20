import { Badge } from "@/components/ui/badge"
import { TicketStatus } from "@/types/tickets"

const getStatusColor = (status: TicketStatus) => {
  const colors = {
    open: "bg-blue-500",
    pending: "bg-yellow-500",
    resolved: "bg-green-500",
    closed: "bg-gray-500",
  }
  return colors[status] || "bg-gray-500"
}

type TicketStatusBadgeProps = {
  status: TicketStatus
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return (
    <Badge className={getStatusColor(status)}>
      {status}
    </Badge>
  )
}