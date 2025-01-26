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
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { useAppDispatch } from "@/store"
import { fetchProfiles } from "@/store/profilesSlice"
import { EnhancedInput } from "@/components/ui/enhanced-input/EnhancedInput"

interface CreateTaskFormProps {
  onSuccess: () => void
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const dispatch = useAppDispatch()

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  })

  useEffect(() => {
    console.log("CreateTaskForm mounted, fetching profiles")
    dispatch(fetchProfiles())
  }, [dispatch])

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .insert([
          {
            title: data.title,
            description: data.description,
            creator_id: user?.id,
          },
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Task created successfully!",
      })
      onSuccess()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
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
                <EnhancedInput placeholder="Task title" {...field} />
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
                <EnhancedInput 
                  placeholder="Describe the task..." 
                  multiline={true} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Task</Button>
      </form>
    </Form>
  )
}