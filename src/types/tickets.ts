export type TicketStatus = "open" | "pending" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"

export type Ticket = {
  id: string
  subject: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  customer: { full_name: string; role: string; email: string } | null
  assignee: { id: string; full_name: string } | null
  project_id: string | null
  project_ticket_key: string | null
  created_at: string
}

export type Project = {
  id: string
  name: string
  code: string
}