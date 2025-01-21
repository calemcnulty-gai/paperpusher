import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TicketTableHeader() {
  return (
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
  )
}