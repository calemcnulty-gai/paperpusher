import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { productColumns } from "@/components/products/ProductColumns"
import { ProductFilters } from "@/components/products/ProductFilters"
import { CreateProductModal } from "@/components/products/CreateProductModal"
import { useAppDispatch, useAppSelector } from "@/store"
import { setPage, setPageSize } from "@/store/productFiltersSlice"
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"

export default function Products() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const { user } = useAuth()
  const { selectedSupplier, selectedSeason, page, pageSize } = useAppSelector(
    (state) => state.productFilters
  )

  // Query to check if user is a principal
  const { data: userProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const isPrincipal = userProfile?.role === 'principal'

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
          if (error.code === 'PGRST103') {
            dispatch(setPage(1))
            toast({
              title: "Pagination Error",
              description: "Returned to first page - no more results available",
              variant: "destructive",
            })
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

  // Function to generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 7 // Total number of page links to show
    const edgePages = 2 // Number of pages to always show at start and end
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first few pages
      for (let i = 1; i <= edgePages; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis and middle pages around current page
      if (page > edgePages + 1) {
        pageNumbers.push('ellipsis')
      }

      const middleStart = Math.max(edgePages + 1, page - 1)
      const middleEnd = Math.min(totalPages - edgePages, page + 1)
      
      for (let i = middleStart; i <= middleEnd; i++) {
        if (!pageNumbers.includes(i)) {
          pageNumbers.push(i)
        }
      }

      // Add ellipsis and last pages
      if (page < totalPages - edgePages - 1) {
        pageNumbers.push('ellipsis')
      }

      // Always show last few pages
      for (let i = totalPages - edgePages + 1; i <= totalPages; i++) {
        if (!pageNumbers.includes(i)) {
          pageNumbers.push(i)
        }
      }
    }

    return pageNumbers
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Products</h1>
      
      <ProductFilters>
        {isPrincipal && <CreateProductModal />}
      </ProductFilters>

      <DataTable 
        columns={productColumns} 
        data={data?.data || []} 
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationFirst
                  onClick={() => dispatch(setPage(1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && dispatch(setPage(page - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, idx) => (
                <PaginationItem key={`${pageNum}-${idx}`}>
                  {pageNum === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => dispatch(setPage(pageNum as number))}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && dispatch(setPage(page + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLast
                  onClick={() => dispatch(setPage(totalPages))}
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
