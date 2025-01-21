import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type Project = {
  id: string
  code: string
  name: string
  description: string | null
  current_ticket_number: number
  created_at: string
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.getValue("code")}
      </Badge>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "current_ticket_number",
    header: "Tickets",
    cell: ({ row }) => row.getValue("current_ticket_number") || 0,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM d, yyyy"),
  },
]