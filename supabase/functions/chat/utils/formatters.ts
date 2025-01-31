import { Message, ProductContext } from '../../shared/types.ts'

export async function formatChatHistory(messages: Message[]): Promise<string> {
  console.log('📜 Formatting chat history', {
    messageCount: messages.length
  })
  const formatted = messages.map(msg => {
    if (msg.role === 'assistant') {
      // Handle task context through metadata
      if (msg.metadata?.taskContext) {
        const { taskId, taskTitle, action } = msg.metadata.taskContext
        if (action === 'created') {
          return `Assistant: Created task "${taskTitle}"`
        } else if (action === 'updated') {
          return `Assistant: Updated task "${taskTitle}"`
        }
      }
    }
    return `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
  }).join('\n')
  
  console.log('📜 Formatted chat history', {
    formattedLength: formatted.length
  })
  return formatted
}

export function formatProductContext(doc: { metadata: ProductContext, pageContent?: string }): string {
  const meta = doc.metadata
  return `Product: ${meta.name || 'Unknown'}
SKU: ${meta.sku || 'N/A'}
Price: ${meta.price ? `$${Number(meta.price).toFixed(2)}` : 'N/A'}
Category: ${meta.category || 'N/A'}
Description: ${meta.description || doc.pageContent || 'No description available'}
---`
} 