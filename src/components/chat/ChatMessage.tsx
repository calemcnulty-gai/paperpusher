import { User } from 'lucide-react'
import { ActionMessage } from './ActionMessage'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
  action?: {
    type: string
    status: 'success' | 'error'
    links?: {
      task?: string
      product?: string
    }
  }
}

export function ChatMessage({ role, content, isLoading, action }: ChatMessageProps) {
  const isUser = role === 'user'
  const bgColor = isUser ? 'bg-indigo-600' : 'bg-gray-100'
  const textColor = isUser ? 'text-white' : 'text-gray-900'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${bgColor}`}>
        <div className="flex items-start">
          {!isUser && (
            <div className="flex-shrink-0 mr-2">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className={`text-sm ${textColor} ${isLoading ? 'opacity-70' : ''}`}>
              {content}
              {isLoading && (
                <span className="inline-block animate-pulse">...</span>
              )}
            </p>
            {action && (
              <div className="mt-2">
                <ActionMessage message={content} action={action} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}