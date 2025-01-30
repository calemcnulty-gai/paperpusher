import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { supabase } from "@/integrations/supabase/client"
import { Product } from "@/types/products"
import { DataTable } from "@/components/ui/data-table"
import { productColumns } from "@/components/products/ProductColumns"
import { ProductFilters } from "@/components/products/ProductFilters"
import { useAuth } from "@/hooks/useAuth"
import { RootState } from "@/store"

export default function Products() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { selectedSupplier, selectedSeason } = useSelector(
    (state: RootState) => state.productFilters
  )

  const { data, isLoading } = useQuery({
    queryKey: ['products', selectedSupplier, selectedSeason, page],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:supplier_id (
            id,
            full_name,
            email
          )
        `)

      if (selectedSupplier) {
        query = query.eq('brand', selectedSupplier)
      }

      if (selectedSeason) {
        query = query.eq('season', selectedSeason)
      }

      const start = (page - 1) * pageSize
      const end = start + pageSize - 1
      
      query = query.range(start, end)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return { data: data as Product[], count }
    }
  })

  const handleRowClick = (product: Product) => {
    navigate(`/products/${product.id}`)
  }

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedSupplier, selectedSeason])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
      </div>

      <div className="space-y-4">
        <ProductFilters />
        
        <DataTable 
          columns={productColumns} 
          data={data?.data || []} 
          rowProps={(row) => ({
            className: "cursor-pointer hover:bg-muted",
            onClick: () => handleRowClick(row)
          })}
        />
      </div>
    </div>
  )
}