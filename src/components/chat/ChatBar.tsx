import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./ChatMessage"
import { useToast } from "@/hooks/use-toast"
import { RootState, AppDispatch } from "@/store"
import { toggleChat, sendMessage, addMessage } from "@/store/chatSlice"
import type { Message } from "@/store/chatSlice"

export function ChatBar() {
  const dispatch = useDispatch<AppDispatch>()
  const { messages, isOpen, isLoading } = useSelector((state: RootState) => state.chat)
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
      const resultAction = await dispatch(sendMessage([...messages, userMessage]))
      if (sendMessage.rejected.match(resultAction)) {
        throw new Error(resultAction.error.message)
      }
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
      "fixed bottom-4 right-4 w-[400px] bg-background border rounded-lg shadow-lg transition-all duration-300 ease-in-out",
      isOpen ? "h-[500px]" : "h-[48px]"
    )}>
      <div className="p-2 border-b flex items-center justify-between cursor-pointer bg-primary/5 rounded-t-lg"
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

      {isOpen && (
        <div className="flex flex-col h-[calc(500px-48px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}