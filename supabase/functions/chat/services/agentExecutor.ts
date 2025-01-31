import { Action, AgentResponse, UserProfile } from '../../shared/types.ts'
import { envConfig } from '../config/langchain.ts'

export async function executeAgentAction(action: Action, userProfile: UserProfile): Promise<AgentResponse> {
  console.log('🎯 Executing agent action - Request preparation:', {
    actionType: action.type,
    actionPayload: action.payload,
    actionMetadata: action.metadata,
    userProfileId: userProfile.id,
    userProfileRole: userProfile.role
  })
  
  const requestBody = {
    action,
    userProfile
  }
  
  console.log('🎯 Executing agent action - Full request body:', JSON.stringify(requestBody, null, 2))
  
  const response = await fetch(`${envConfig.SUPABASE_URL}/functions/v1/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${envConfig.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Agent action failed', {
      status: response.status,
      error: error,
      requestBody: requestBody
    })
    throw new Error(`Agent function error: ${error}`)
  }

  const result = await response.json() as AgentResponse
  console.log('✅ Agent action completed - Full result:', JSON.stringify(result, null, 2))
  return result
} 