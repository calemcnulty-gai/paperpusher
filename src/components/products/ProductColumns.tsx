import { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"
import type { Product } from "@/types/products"

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
    accessorKey: "brand",
    header: "Brand",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => formatDate(row.getValue("created_at")),
  },
]