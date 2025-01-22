import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

type Template = {
  id: string
  title: string
  content: string
  created_at: string
  category: string | null
  category_id: string | null
  usage_count: number
}

export function useTemplates(selectedCategory: string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ["response-templates", selectedCategory],
    queryFn: async () => {
      console.log("Fetching templates for category:", selectedCategory)
      let query = supabase
        .from("response_templates")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      console.log("Fetched templates:", data)
      return data as Template[]
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("response_templates")
        .delete()
        .eq("id", id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["response-templates"] })
      toast({
        title: "Success",
        description: "Template deleted successfully",
      })
    },
    onError: (error) => {
      console.error("Error deleting template:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete template. Please try again.",
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string, title: string, content: string, category_id?: string }) => {
      const { error } = await supabase
        .from("response_templates")
        .update({ 
          title: data.title, 
          content: data.content,
          category_id: data.category_id 
        })
        .eq("id", data.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["response-templates"] })
      toast({
        title: "Success",
        description: "Template updated successfully",
      })
    },
    onError: (error) => {
      console.error("Error updating template:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update template. Please try again.",
      })
    }
  })

  return {
    templates: templatesQuery.data,
    isLoading: templatesQuery.isLoading,
    deleteMutation,
    updateMutation
  }
}