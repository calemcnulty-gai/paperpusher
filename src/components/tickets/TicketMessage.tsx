import { format } from "date-fns"
import MDEditor from '@uiw/react-md-editor'

type TicketMessageProps = {
  sender: {
    full_name: string
    role: string
  }
  message: string
  created_at: string
  className?: string
}

export const TicketMessage = ({ sender, message, created_at, className = "" }: TicketMessageProps) => {
  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">{sender.full_name}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(created_at), "MMM d, yyyy HH:mm")}
        </p>
      </div>
      <div className="mt-1 bg-[#F1F0FB] rounded-md p-3">
        <MDEditor.Markdown source={message} />
      </div>
    </div>
  )
}