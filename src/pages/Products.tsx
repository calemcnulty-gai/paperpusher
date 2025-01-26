import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { productColumns } from "@/components/products/ProductColumns"
import { ProductFilters } from "@/components/products/ProductFilters"
import type { Product } from "@/types/products"

export default function Products() {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedSupplier, selectedSeason],
    queryFn: async () => {
      console.log('Fetching products with filters:', { selectedSupplier, selectedSeason })
      let query = supabase
        .from('products')
        .select('*, profiles:supplier_id(full_name)')

      if (selectedSupplier) {
        query = query.eq('supplier_id', selectedSupplier)
      }
      if (selectedSeason && selectedSeason !== 'all') {
        query = query.eq('season', selectedSeason)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      console.log('Fetched products:', data)
      return data as Product[]
    }
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      
      <ProductFilters 
        onSupplierChange={setSelectedSupplier}
        onSeasonChange={setSelectedSeason}
        onUserChange={() => {}} // Removed user filter functionality
      />

      <DataTable 
        columns={productColumns} 
        data={products || []} 
      />
    </div>
  )
}