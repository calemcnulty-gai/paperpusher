import { TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Profile } from "@/types/profiles"

type TicketAssigneeCellProps = {
  assigneeId: string | null
  agents: Profile[]
  ticketId: string
  canEdit: boolean
  onAssigneeChange: (ticketId: string, newAssigneeId: string) => Promise<void>
}

const UNASSIGNED_VALUE = "unassigned"

export function TicketAssigneeCell({ assigneeId, agents, ticketId, canEdit, onAssigneeChange }: TicketAssigneeCellProps) {
  return (
    <TableCell>
      {canEdit ? (
        <Select
          value={assigneeId || UNASSIGNED_VALUE}
          onValueChange={(value) => {
            // Prevent row click when interacting with select
            event?.stopPropagation()
            onAssigneeChange(ticketId, value)
          }}
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
        agents.find(agent => agent.id === assigneeId)?.full_name || "Unassigned"
      )}
    </TableCell>
  )
}