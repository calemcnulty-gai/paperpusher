import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import MDEditor from '@uiw/react-md-editor'

type TemplateFormData = {
  title: string
  content: string
}

type TemplateFormProps = {
  onSubmit: (data: TemplateFormData) => Promise<void>
  isSubmitting?: boolean
  defaultValues?: Partial<TemplateFormData>
}

export function TemplateForm({ onSubmit, isSubmitting, defaultValues }: TemplateFormProps) {
  const form = useForm<TemplateFormData>({
    defaultValues: {
      title: defaultValues?.title || "",
      content: defaultValues?.content || "",
    }
  })

  return (
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
                <MDEditor
                  value={field.value}
                  onChange={(value) => field.onChange(value || "")}
                  preview="edit"
                  height={300}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Template"}
        </Button>
      </form>
    </Form>
  )
}