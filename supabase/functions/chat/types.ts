export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: Message[]
  productId?: string
}

export interface ChatResponse {
  role: 'assistant'
  content: string
}

export interface ProductContext {
  id: string
  name: string
  description: string
  price?: number
  specifications?: Record<string, any>
  metadata?: Record<string, any>
} 