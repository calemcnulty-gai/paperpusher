import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketStatus, TicketPriority } from "@/types/tickets"

type TicketFiltersProps = {
  status: TicketStatus | "all"
  priority: TicketPriority | "all"
  onStatusChange: (status: TicketStatus | "all") => void
  onPriorityChange: (priority: TicketPriority | "all") => void
}

export function TicketFilters({
  status,
  priority,
  onStatusChange,
  onPriorityChange
}: TicketFiltersProps) {
  return (
    <div className="flex gap-4 mb-4">
      <div>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}