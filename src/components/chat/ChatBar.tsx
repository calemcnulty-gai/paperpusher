import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./ChatMessage"
import { useToast } from "@/hooks/use-toast"
import { RootState } from "@/store"
import { toggleChat, sendMessage, addMessage } from "@/store/chatSlice"
import type { Message } from "@/store/chatSlice"

export function ChatBar() {
  const dispatch = useDispatch()
  const { messages, isOpen, isLoading } = useSelector((state: RootState) => state.state)
  const { user } = useSelector((state: RootState) => state.auth)
  const [input, setInput] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    dispatch(addMessage(userMessage))
    setInput("")

    try {
      await dispatch(sendMessage([...messages, userMessage])).unwrap()
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again."
      })
    }
  }

  // Don't show chat if user is not authenticated
  if (!user) return null;

  return (
    <div className={cn(
      "fixed bottom-0 right-0 w-full md:w-[400px] bg-background border-t md:border-l shadow-lg transition-transform duration-300 ease-in-out",
      isOpen ? "translate-y-0" : "translate-y-[90%]"
    )}>
      <div className="p-2 border-b flex items-center justify-between cursor-pointer"
        onClick={() => dispatch(toggleChat())}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Chat Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation()
          dispatch(toggleChat())
        }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-[400px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}