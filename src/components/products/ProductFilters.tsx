import { useQuery } from "@tanstack/react-query"
import { Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useAppDispatch, useAppSelector } from "@/store"
import { setSelectedSupplier, setSelectedSeason } from "@/store/productFiltersSlice"

export function ProductFilters({ children }: { children?: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { selectedSupplier, selectedSeason } = useAppSelector(
    (state) => state.productFilters
  )

  const { data: products } = useQuery({
    queryKey: ['products-for-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
      
      if (error) throw error

      // Get unique brands
      const uniqueBrands = Array.from(new Set(data.map(p => p.brand)))
        .filter((brand): brand is string => brand !== null)
        .sort()
      
      return uniqueBrands
    }
  })

  const seasons = ['all', 'spring', 'summer', 'fall', 'winter']

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Select 
            value={selectedSupplier || undefined}
            onValueChange={(value) => dispatch(setSelectedSupplier(value === 'all' ? null : value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {products?.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedSeason || undefined}
            onValueChange={(value) => dispatch(setSelectedSeason(value === 'all' ? null : value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season} value={season}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {children}
    </div>
  )
}