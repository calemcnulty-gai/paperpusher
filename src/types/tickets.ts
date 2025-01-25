export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketMessage = {
  id: string;
  message: string;
  created_at: string;
  sender: {
    full_name: string;
    role: string;
  };
};

export type Ticket = {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customer: { full_name: string; role: string; email: string } | null;
  assignee: { id: string; full_name: string } | null;
  project_id: string | null;
  project_ticket_key: string | null;
  created_at: string;
  messages: TicketMessage[];
};

export type Project = {
  id: string;
  name: string;
  code: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  creator_id: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
};