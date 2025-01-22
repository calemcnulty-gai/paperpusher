import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageSquare, Edit, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TemplateForm } from "./TemplateForm"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Template = {
  id: string
  title: string
  content: string
  created_at: string
  category: string | null
  usage_count: number
}

type TemplateListProps = {
  onSelect?: (content: string) => void
  showActions?: boolean
}

export function TemplateList({ onSelect, showActions = true }: TemplateListProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const { data: templates, isLoading } = useQuery({
    queryKey: ["response-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_templates")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error
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
    mutationFn: async (data: { id: string, title: string, content: string }) => {
      const { error } = await supabase
        .from("response_templates")
        .update({ title: data.title, content: data.content })
        .eq("id", data.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["response-templates"] })
      toast({
        title: "Success",
        description: "Template updated successfully",
      })
      setEditingTemplate(null)
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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleUpdate = async (data: { title: string, content: string }) => {
    if (!editingTemplate) return
    updateMutation.mutate({ id: editingTemplate.id, ...data })
  }

  if (isLoading) {
    return <div>Loading templates...</div>
  }

  if (!templates || templates.length === 0) {
    return <div className="text-sm text-muted-foreground">No templates available</div>
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="flex items-center justify-between group">
            <Button
              variant="ghost"
              className="w-full justify-start mr-2"
              onClick={() => onSelect?.(template.content)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span className="truncate">{template.title}</span>
              {template.usage_count > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Used {template.usage_count} times
                </span>
              )}
            </Button>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              onSubmit={handleUpdate}
              defaultValues={{
                title: editingTemplate.title,
                content: editingTemplate.content,
              }}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}