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

export function ProductFilters() {
  const dispatch = useAppDispatch()
  const { selectedSupplier, selectedSeason } = useAppSelector(
    (state) => state.productFilters
  )

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'supplier')
      
      if (error) throw error
      return data
    }
  })

  const seasons = ['all', 'spring', 'summer', 'fall', 'winter']

  return (
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
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers?.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.full_name}
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
  )
}