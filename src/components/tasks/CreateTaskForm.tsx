import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DialogClose } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { MentionsInput } from "@/components/ui/mentions-input/MentionsInput"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Database } from "@/integrations/supabase/types"

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"]

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  priority: z.string(),
  status: z.string()
})

type FormData = z.infer<typeof formSchema>

export function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "open"
    }
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      console.log("Creating task with data:", data)
      const taskData: TaskInsert = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        creator_id: user.id
      }

      const { error } = await supabase
        .from("tasks")
        .insert(taskData)

      if (error) throw error

      toast({
        title: "Success",
        description: "Task created successfully"
      })
      
      onSuccess()
      form.reset()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <MentionsInput {...field} placeholder="Enter task title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <MentionsInput {...field} multiline placeholder="Enter task description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  )
}