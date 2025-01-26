import { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"
import type { Product } from "@/types/products"
import { DocumentUpload } from "./DocumentUpload"

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(price)
    },
  },
  {
    accessorKey: "profiles.full_name",
    header: "Supplier",
  },
  {
    accessorKey: "season",
    header: "Season",
    cell: ({ row }) => {
      const season = row.getValue("season") as string
      return season.charAt(0).toUpperCase() + season.slice(1)
    },
  },
  {
    accessorKey: "stock_quantity",
    header: "Stock",
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <DocumentUpload productId={row.original.id} />
    },
  },
]