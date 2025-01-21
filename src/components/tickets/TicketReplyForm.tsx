import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type TicketReplyFormProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (isInternal?: boolean) => Promise<void>
  isSubmitting: boolean
}

export const TicketReplyForm = ({ 
  value, 
  onChange, 
  onSubmit, 
  isSubmitting
}: TicketReplyFormProps) => {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">Add a message</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-[100px]"
      />
      <div className="flex gap-2 mt-2">
        <Button 
          onClick={() => onSubmit()} 
          disabled={!value.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => onSubmit(true)} 
          disabled={!value.trim() || isSubmitting}
        >
          Send as Internal Note
        </Button>
      </div>
    </div>
  )
}