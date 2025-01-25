import { useState, useRef, useCallback } from "react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Profile } from "@/types/profiles"

type FormData = {
  title: string
  description: string
  priority: string
  status: string
}

export function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUserMentions, setShowUserMentions] = useState(false)
  const [mentionAnchorPoint, setMentionAnchorPoint] = useState({ x: 0, y: 0 })
  const [mentionSearch, setMentionSearch] = useState("")
  const [users, setUsers] = useState<Profile[]>([])
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

  const fetchUsers = useCallback(async (searchTerm: string) => {
    try {
      console.log("Fetching users with search term:", searchTerm)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${searchTerm}%`)
        .limit(5)

      if (error) throw error
      console.log("Fetched users:", data)
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [])

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, field: "title" | "description") => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement
    const value = target.value
    const cursorPosition = target.selectionStart || 0
    
    // Find the word being typed
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    if (currentWord.startsWith("@")) {
      const searchTerm = currentWord.slice(1)
      setMentionSearch(searchTerm)
      setCurrentField(field)
      
      // Get position for popover
      const rect = target.getBoundingClientRect()
      const caretCoords = getCaretCoordinates(target, cursorPosition)
      
      setMentionAnchorPoint({
        x: rect.left + caretCoords.left,
        y: rect.top + caretCoords.top + 20
      })
      
      setShowUserMentions(true)
      fetchUsers(searchTerm)
    } else {
      setShowUserMentions(false)
    }
  }

  const handleMentionSelect = (selectedUser: Profile) => {
    const field = currentField
    if (!field) return

    const formValue = form.getValues(field)
    const target = field === "title" ? titleRef.current : descriptionRef.current
    if (!target) return

    const cursorPosition = target.selectionStart || 0
    const textBeforeCursor = formValue.slice(0, cursorPosition)
    const textAfterCursor = formValue.slice(cursorPosition)
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    if (lastAtIndex === -1) return

    const newText = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      `@${selectedUser.full_name} ` + 
      textAfterCursor

    form.setValue(field, newText)
    setShowUserMentions(false)
  }

  const handleCommandInputChange = (value: string) => {
    console.log("Command input changed:", value)
    setMentionSearch(value)
    if (value.trim()) {
      fetchUsers(value)
    }
  }

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
                  onKeyUp={(e) => handleKeyUp(e, "title")}
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
                  onKeyUp={(e) => handleKeyUp(e, "description")}
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

        {showUserMentions && (
          <Popover open={showUserMentions} onOpenChange={setShowUserMentions}>
            <PopoverContent 
              className="p-0" 
              style={{
                position: 'fixed',
                left: `${mentionAnchorPoint.x}px`,
                top: `${mentionAnchorPoint.y}px`,
                width: '250px'
              }}
            >
              <Command>
                <CommandInput 
                  placeholder="Search users..." 
                  value={mentionSearch}
                  onValueChange={handleCommandInputChange}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleMentionSelect(user)}
                        className="cursor-pointer"
                      >
                        {user.full_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </form>
    </Form>
  )
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLElement, position: number) {
  const { offsetLeft: left, offsetTop: top } = element
  return { left, top }
}