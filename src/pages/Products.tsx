import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { productColumns } from "@/components/products/ProductColumns"
import { ProductFilters } from "@/components/products/ProductFilters"
import type { Product } from "@/types/products"
import { useAppDispatch, useAppSelector } from "@/store"
import { setPage, setPageSize } from "@/store/productFiltersSlice"
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"

export default function Products() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { selectedSupplier, selectedSeason, page, pageSize } = useAppSelector(
    (state) => state.productFilters
  )

  const { data, isLoading } = useQuery({
    queryKey: ['products', selectedSupplier, selectedSeason, page, pageSize],
    queryFn: async () => {
      console.log('Fetching products with filters:', { selectedSupplier, selectedSeason, page, pageSize })
      let query = supabase
        .from('products')
        .select('*, profiles:supplier_id(full_name)', { count: 'exact' })

      if (selectedSupplier) {
        query = query.eq('brand', selectedSupplier)
      }
      if (selectedSeason && selectedSeason !== 'all') {
        query = query.eq('season', selectedSeason)
      }

      // Add pagination
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1
      
      try {
        const { data, error, count } = await query.range(start, end)
        
        if (error) {
          // Check if it's a range error
          if (error.code === 'PGRST103') {
            // Reset to page 1
            dispatch(setPage(1))
            toast({
              title: "Pagination Error",
              description: "Returned to first page - no more results available",
              variant: "destructive",
            })
            // Refetch first page
            const { data: firstPageData, count: firstPageCount } = await query.range(0, pageSize - 1)
            return { data: firstPageData, count: firstPageCount }
          }
          throw error
        }
        
        return { data, count }
      } catch (error) {
        console.error('Error fetching products:', error)
        throw error
      }
    },
    placeholderData: (previousData) => previousData
  })

  const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      
      <ProductFilters />

      <DataTable 
        columns={productColumns} 
        data={data?.data || []} 
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && dispatch(setPage(page - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => dispatch(setPage(i + 1))}
                    isActive={page === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && dispatch(setPage(page + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}