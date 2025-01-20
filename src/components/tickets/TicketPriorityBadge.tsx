import { Badge } from "@/components/ui/badge"
import { TicketPriority } from "@/types/tickets"

const getPriorityColor = (priority: TicketPriority) => {
  const colors = {
    low: "bg-gray-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }
  return colors[priority] || "bg-gray-500"
}

type TicketPriorityBadgeProps = {
  priority: TicketPriority
}

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  return (
    <Badge className={getPriorityColor(priority)}>
      {priority}
    </Badge>
  )
}