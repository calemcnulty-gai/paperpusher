import { useState } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

type TemplateFormData = {
  title: string
  content: string
}

export function CreateTemplateModal() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const form = useForm<TemplateFormData>({
    defaultValues: {
      title: "",
      content: "",
    }
  })

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
      form.reset()
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Response Template</DialogTitle>
          <DialogDescription>
            Create a new response template that can be used by agents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter template content"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create Template
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}