import { ColumnDef } from "@tanstack/react-table"
import { useNavigate } from "react-router-dom"
import { Profile } from "@/types/profiles"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<Profile>[] = [
  {
    accessorKey: "full_name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
      )
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