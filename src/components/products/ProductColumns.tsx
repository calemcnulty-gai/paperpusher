import { ColumnDef } from "@tanstack/react-table"
import type { Product } from "@/types/products"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon } from "lucide-react"

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "image_url",
    header: "Thumbnail",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image_url") as string
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80">
              <AvatarImage src={imageUrl} alt={row.getValue("name")} />
              <AvatarFallback>
                <ImageIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={row.getValue("name")}
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      )
    },
  },
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
    accessorKey: "wholesale_price",
    header: "Wholesale Price",
    cell: ({ row }) => {
      const price = row.getValue("wholesale_price")
      return price ? `$${Number(price).toFixed(2)}` : "-"
    },
  },
  {
    accessorKey: "retail_price",
    header: "Retail Price",
    cell: ({ row }) => {
      const price = row.getValue("retail_price")
      return price ? `$${Number(price).toFixed(2)}` : "-"
    },
  },
]