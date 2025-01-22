import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { TemplateForm } from "./TemplateForm"

type TemplateFormData = {
  title: string
  content: string
}

export function CreateTemplateModal() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const onSubmit = async (data: TemplateFormData) => {
    try {
      const { error } = await supabase.from("response_templates").insert({
        title: data.title,
        content: data.content,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Template created successfully",
      })
      
      queryClient.invalidateQueries({ queryKey: ["response-templates"] })
      setOpen(false)
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create template. Please try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Response Template</DialogTitle>
          <DialogDescription>
            Create a new response template that can be used by agents. You can use Markdown for formatting.
          </DialogDescription>
        </DialogHeader>
        <TemplateForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}