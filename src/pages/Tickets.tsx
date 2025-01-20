import { MainLayout } from "@/components/layout/MainLayout"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

const fetchTickets = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      customer:profiles!tickets_customer_id_fkey(full_name),
      assignee:profiles!tickets_assigned_to_fkey(full_name)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

const getStatusColor = (status: string) => {
  const colors = {
    open: "bg-blue-500",
    pending: "bg-yellow-500",
    resolved: "bg-green-500",
    closed: "bg-gray-500",
  }
  return colors[status as keyof typeof colors] || "bg-gray-500"
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: "bg-gray-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  }
  return colors[priority as keyof typeof colors] || "bg-gray-500"
}

const Tickets = () => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  })

  console.log("Tickets data:", tickets)

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tickets</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.customer?.full_name}</TableCell>
                    <TableCell>{ticket.assignee?.full_name || "Unassigned"}</TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default Tickets