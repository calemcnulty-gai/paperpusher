import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./ChatMessage"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [...messages, userMessage] }
      })

      if (error) throw error

      if (data) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn(
      "fixed bottom-0 right-0 w-full md:w-[400px] bg-background border-t md:border-l shadow-lg transition-transform duration-300 ease-in-out",
      isOpen ? "translate-y-0" : "translate-y-[90%]"
    )}>
      <div className="p-2 border-b flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(prev => !prev)}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Chat Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation()
          setIsOpen(false)
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