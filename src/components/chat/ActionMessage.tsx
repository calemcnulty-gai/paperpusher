import { Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'

interface ActionMessageProps {
  message: string
  action?: {
    type: string
    status: 'success' | 'error'
    links?: {
      task?: string
      product?: string
    }
  }
}

export function ActionMessage({ message, action }: ActionMessageProps) {
  if (!action) return null

  const isSuccess = action.status === 'success'
  const Icon = isSuccess ? CheckCircle : XCircle
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50'
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800'
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200'
  const iconColor = isSuccess ? 'text-green-400' : 'text-red-400'

  return (
    <div className={`rounded-lg p-4 ${bgColor} border ${borderColor} mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          {action.links && (
            <div className="mt-2 text-sm">
              {action.links.task && (
                <Link
                  to={action.links.task}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View Task →
                </Link>
              )}
              {action.links.product && (
                <Link
                  to={action.links.product}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 ml-4"
                >
                  View Product →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 