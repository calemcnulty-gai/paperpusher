import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface Client {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

interface ClientTableProps {
  clients: Client[];
}

// Changed to default export to match the import
const ClientTable = ({ clients }: ClientTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.full_name || "N/A"}</TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell>{formatDate(client.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientTable;