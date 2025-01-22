import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TemplateCategorySelect } from "./TemplateCategorySelect"
import { TemplateListItem } from "./TemplateListItem"
import { TemplateEditDialog } from "./TemplateEditDialog"
import { useTemplates } from "./useTemplates"

type Template = {
  id: string
  title: string
  content: string
  created_at: string
  category: string | null
  category_id: string | null
  usage_count: number
}

type TemplateListProps = {
  onSelect?: (content: string) => void
  showActions?: boolean
}

export function TemplateList({ onSelect, showActions = true }: TemplateListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  
  const { 
    templates, 
    isLoading, 
    deleteMutation, 
    updateMutation 
  } = useTemplates(selectedCategory)

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id)
    }
  }

  const handleUpdate = async (data: { title: string, content: string, category_id?: string }) => {
    if (!editingTemplate) return
    updateMutation.mutate({ id: editingTemplate.id, ...data })
    setEditingTemplate(null)
  }

  if (isLoading) {
    return <div>Loading templates...</div>
  }

  if (!templates || templates.length === 0) {
    return <div className="text-sm text-muted-foreground">No templates available</div>
  }

  return (
    <div className="space-y-4">
      <div className="w-[200px]">
        <TemplateCategorySelect
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        />
      </div>

      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {templates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              onSelect={onSelect}
              onEdit={setEditingTemplate}
              onDelete={handleDelete}
              showActions={showActions}
            />
          ))}
        </div>
      </ScrollArea>

      <TemplateEditDialog
        template={editingTemplate}
        isOpen={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  )
}