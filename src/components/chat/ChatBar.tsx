import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { sendMessage, Message } from '@/store/chatSlice'
import { useToast } from '@/components/ui/use-toast'
import { ChatMessage } from './ChatMessage'

export function ChatBar() {
  const dispatch = useAppDispatch()
  const [input, setInput] = useState('')
  const { toast } = useToast()

  const messages = useAppSelector(state => state.chat.messages)
  const isLoading = useAppSelector(state => state.chat.isLoading)
  const error = useAppSelector(state => state.chat.error)
  const lastAction = useAppSelector(state => state.agent.lastAction)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (lastAction && lastAction.metadata.status === 'success') {
      toast({
        title: 'Action Completed',
        description: lastAction.payload?.message || 'Operation completed successfully',
        action: lastAction.payload?.links && (
          <Link
            to={Object.values(lastAction.payload.links)[0]}
            className="text-sm font-medium text-primary hover:opacity-90"
          >
            {`View ${lastAction.type.split('_')[1].toLowerCase()}`} →
          </Link>
        )
      })
    } else if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error
      })
    }
  }, [lastAction, error, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const newMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setInput('')
    await dispatch(sendMessage([...messages, newMessage]))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="max-w-4xl mx-auto p-4">
        <div className="max-h-[60vh] overflow-y-auto mb-4">
          {messages.map((message, i) => (
            <ChatMessage
              key={i}
              role={message.role}
              content={message.content}
              isLoading={i === messages.length - 1 && message.role === 'assistant' && isLoading}
              action={i === messages.length - 1 ? lastAction : undefined}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}