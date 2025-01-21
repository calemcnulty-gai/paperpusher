import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type TicketReplyFormProps = {
  reply: string
  setReply: (reply: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  canReply: boolean
}

export const TicketReplyForm = ({ 
  reply, 
  setReply, 
  onSubmit, 
  isSubmitting,
  canReply 
}: TicketReplyFormProps) => {
  if (!canReply) return null

  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">Add a message</p>
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Type your message here..."
        className="min-h-[100px]"
      />
      <Button 
        onClick={onSubmit} 
        className="mt-2"
        disabled={!reply.trim() || isSubmitting}
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
    </div>
  )
}