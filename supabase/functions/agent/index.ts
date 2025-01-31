import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from './config/cors.ts'
import { createTaskExecutor } from './executors/taskExecutor.ts'
import { createProductExecutor } from './executors/productExecutor.ts'
import { AgentRequest, AgentResponse, Action } from '../shared/types.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse and validate request
    const { action, userProfile }: AgentRequest = await req.json()
    if (!action || !userProfile) {
      throw new Error('Invalid request: missing action or userProfile')
    }

    console.log('🔄 Processing agent request', {
      actionType: action.type,
      userId: userProfile.id,
      userRole: userProfile.role
    })

    // Validate user permissions
    if (action.type === 'UPDATE_PRODUCT' && userProfile.role !== 'principal') {
      throw new Error('Unauthorized: only principals can update products')
    }

    // Execute action based on type
    let result: AgentResponse
    switch (action.type) {
      case 'CREATE_TASK':
      case 'UPDATE_TASK': {
        const taskExecutor = await createTaskExecutor()
        result = await taskExecutor.execute(action, userProfile)
        break
      }
      case 'UPDATE_PRODUCT': {
        const productExecutor = await createProductExecutor()
        result = await productExecutor.execute(action, userProfile)
        break
      }
      case 'NORMAL_RESPONSE':
        result = {
          message: action.payload.message || 'No action needed',
          action: {
            type: 'NORMAL_RESPONSE',
            status: 'success',
            data: null
          }
        }
        break
      default:
        throw new Error(`Unsupported action type: ${action.type}`)
    }

    console.log('✅ Action executed successfully', {
      actionType: action.type,
      status: result.action.status
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing agent request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 