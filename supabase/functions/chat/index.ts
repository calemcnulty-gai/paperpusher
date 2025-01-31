import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './config/cors.ts'
import { createRagChain } from './chains/rag.ts'
import { createClassifierChain } from './chains/classifier.ts'
import { createAgentChain } from './chains/agent.ts'
import { getUserProfile } from './services/userProfile.ts'
import { executeAgentAction } from './services/agentExecutor.ts'
import { ChatRequest, ChatResponse } from '../shared/types.ts'

// Initialize chains
const ragChain = await createRagChain()
const classifierChain = await createClassifierChain()
const agentChain = await createAgentChain()

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user profile from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    console.log('🔐 Getting user profile')
    const userProfile = await getUserProfile(authHeader)
    console.log('✅ User profile retrieved', {
      userId: userProfile.id,
      role: userProfile.role
    })

    // Parse request body
    const { messages }: ChatRequest = await req.json()
    if (!messages?.length) {
      throw new Error('No messages provided')
    }

    console.log('📨 Processing chat request', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1].content
    })

    // Get response from RAG chain
    const ragResponse = await ragChain.invoke({
      question: messages[messages.length - 1].content,
      chat_history: messages.slice(0, -1)
    })
    console.log('🤖 RAG response generated')

    // Check if action is needed
    const classification = await classifierChain.invoke({ messages })
    console.log('🔍 Message classified', classification)

    let response: ChatResponse = {
      message: ragResponse
    }

    if (classification.requires_action && classification.confidence > 0.7) {
      console.log('🎯 Action required, generating action')
      const agentResponse = await agentChain.invoke({
        messages,
        userId: userProfile.id,
        userRole: userProfile.role
      })

      if (agentResponse.type !== 'NORMAL_RESPONSE') {
        console.log('🔄 Executing agent action')
        const actionResult = await executeAgentAction(agentResponse, userProfile)
        console.log('✅ Action executed', actionResult)

        // Add task metadata to the response
        const taskMetadata = actionResult.action.data ? {
          taskContext: {
            taskId: actionResult.action.data.id,
            taskTitle: actionResult.action.data.title,
            action: actionResult.action.type === 'CREATE_TASK' ? 'created' : 'updated'
          }
        } : undefined

        // Return response with metadata
        response = {
          message: actionResult.message,
          action: agentResponse,
          metadata: taskMetadata
        }
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})