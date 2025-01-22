import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TemplateCategorySelectProps = {
  value?: string
  onValueChange: (value: string) => void
}

export function TemplateCategorySelect({ value, onValueChange }: TemplateCategorySelectProps) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["template-categories"],
    queryFn: async () => {
      console.log("Fetching template categories")
      const { data, error } = await supabase
        .from("template_categories")
        .select("*")
        .order("name")
      
      if (error) {
        console.error("Error fetching categories:", error)
        throw error
      }
      
      console.log("Fetched categories:", data)
      return data
    }
  })

  if (isLoading) {
    return <Select disabled><SelectTrigger>Loading categories...</SelectTrigger></Select>
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Categories</SelectItem>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}