import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TemplateList } from "@/components/templates/TemplateList"
import { useSelector } from "react-redux"
import { RootState } from "@/store"

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
  isSubmitting,
}: TicketReplyFormProps) => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role)
  const canUseTemplates = userRole === 'agent' || userRole === 'admin'

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">Add a message</p>
        {canUseTemplates && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Quick Responses
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Response Templates</h4>
                <TemplateList onSelect={onChange} />
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
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