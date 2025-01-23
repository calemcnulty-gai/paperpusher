import { format } from "date-fns"
import MDEditor from "@uiw/react-md-editor"

type TicketMessageProps = {
  message: string
  sender: {
    full_name: string
    role: string
  }
  created_at: string
}

export const TicketMessage = ({ message, sender, created_at }: TicketMessageProps) => {
  return (
    <div>
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          {sender.full_name}
          <span className="ml-2 text-xs text-muted-foreground">({sender.role})</span>
        </p>
        <p>
          {format(new Date(created_at), "MMM d, yyyy HH:mm")}
        </p>
      </div>
      <div className="mt-1 bg-background rounded-md p-3 border">
        <MDEditor.Markdown 
          source={message} 
          className="!bg-background !text-foreground" 
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  )
}