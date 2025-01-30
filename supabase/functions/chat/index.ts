import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { ChatRequest, ChatResponse } from './types.ts'

Deno.serve(async (req) => {
  try {
    const { messages, productId } = await req.json() as ChatRequest
    
    const response: ChatResponse = {
      role: 'assistant',
      content: 'Chat functionality coming soon!'
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 