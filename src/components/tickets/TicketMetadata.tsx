import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TicketStatus, TicketPriority, Project } from "@/types/tickets"

type TicketMetadataProps = {
  status: TicketStatus
  priority: TicketPriority
  projectId: string | null
  customer?: { full_name: string } | null
  assignee?: { full_name: string } | null
  createdAt: string
  projects?: Project[]
  onStatusChange: (status: TicketStatus) => void
  onPriorityChange: (priority: TicketPriority) => void
  onProjectChange: (projectId: string | null) => void
}

export function TicketMetadata({
  status,
  priority,
  projectId,
  customer,
  assignee,
  createdAt,
  projects,
  onStatusChange,
  onPriorityChange,
  onProjectChange
}: TicketMetadataProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <p className="text-sm font-medium">Status</p>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm font-medium">Priority</p>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm font-medium">Project</p>
        <Select 
          value={projectId || "no-project"} 
          onValueChange={(value) => onProjectChange(value === "no-project" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-project">No Project</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name} ({project.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm font-medium">Customer</p>
        <p className="text-sm">{customer?.full_name || "Unknown"}</p>
      </div>
      <div>
        <p className="text-sm font-medium">Assigned To</p>
        <p className="text-sm">{assignee?.full_name || "Unassigned"}</p>
      </div>
      <div>
        <p className="text-sm font-medium">Created</p>
        <p className="text-sm">{new Date(createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  )
}