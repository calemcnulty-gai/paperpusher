import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TemplateForm } from "./TemplateForm"

type Template = {
  id: string
  title: string
  content: string
  category_id: string | null
}

type TemplateEditDialogProps = {
  template: Template | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string, content: string, category_id?: string }) => Promise<void>
  isSubmitting?: boolean
}

export function TemplateEditDialog({ 
  template, 
  isOpen, 
  onOpenChange, 
  onSubmit,
  isSubmitting 
}: TemplateEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        {template && (
          <TemplateForm
            onSubmit={onSubmit}
            defaultValues={{
              title: template.title,
              content: template.content,
              category_id: template.category_id || "",
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}