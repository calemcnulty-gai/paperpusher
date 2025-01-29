import { ColumnDef } from "@tanstack/react-table"
import { Profile } from "@/types/profiles"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export const columns: ColumnDef<Profile>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "full_name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant="outline" className="capitalize">
          {role || "N/A"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => {
      return formatDate(row.getValue("created_at"))
    },
  },
]

export const useUserRowProps = () => {
  const navigate = useNavigate()

  return (row: Profile) => ({
    className: "cursor-pointer hover:bg-gray-50",
    onClick: () => navigate(`/${row.role}s/${row.id}`)
  })
}