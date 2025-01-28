import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DataTable } from "@/components/ui/data-table"
import { productColumns } from "@/components/products/ProductColumns"
import { ProductFilters } from "@/components/products/ProductFilters"
import { ProductModal } from "@/components/products/ProductModal"
import { useAppDispatch, useAppSelector } from "@/store"
import { setPage, setPageSize } from "@/store/productFiltersSlice"
import { Product } from "@/components/products/ProductForm"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedProduct(null)
    setIsModalOpen(false)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="container space-y-8 py-8">
      <div className="px-2">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Products</h1>
          {isPrincipal && (
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
        
        <ProductFilters />
      </div>

      <div className="px-2">
        <DataTable 
          columns={productColumns} 
          data={data?.data || []} 
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />
      </div>

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

              {/* Add page numbers here */}
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

      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userId={user?.id}
      />
    </div>
  )
}