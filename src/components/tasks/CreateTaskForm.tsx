import { useState, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { DialogClose } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { UserMentionsPopover } from "./UserMentionsPopover"
import { useMentions } from "@/hooks/useMentions"

type FormData = {
  title: string
  description: string
  priority: string
  status: string
}

export function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentField, setCurrentField] = useState<"title" | "description" | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const form = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "open"
    }
  })

  const handleMentionInsert = (text: string) => {
    if (!currentField) return

    const formValue = form.getValues(currentField)
    const target = currentField === "title" ? titleRef.current : descriptionRef.current
    if (!target) return

    const cursorPosition = target.selectionStart || 0
    const textBeforeCursor = formValue.slice(0, cursorPosition)
    const textAfterCursor = formValue.slice(cursorPosition)
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    if (lastAtIndex === -1) return

    const newText = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      text + 
      textAfterCursor

    form.setValue(currentField, newText)
  }

  const {
    showMentions,
    setShowMentions,
    anchorPoint,
    searchTerm,
    setSearchTerm,
    handleKeyUp,
    handleMentionSelect,
  } = useMentions({
    onMentionSelect: handleMentionInsert,
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          ...data,
          creator_id: user.id
        })

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
                <Input 
                  {...field} 
                  ref={titleRef}
                  onKeyUp={(e) => {
                    setCurrentField("title")
                    handleKeyUp(e, e.currentTarget)
                  }}
                />
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
                <Textarea 
                  {...field} 
                  ref={descriptionRef}
                  onKeyUp={(e) => {
                    setCurrentField("description")
                    handleKeyUp(e, e.currentTarget)
                  }}
                />
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

        <UserMentionsPopover
          open={showMentions}
          onOpenChange={setShowMentions}
          anchorPoint={anchorPoint}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onUserSelect={handleMentionSelect}
        />
      </form>
    </Form>
  )
}