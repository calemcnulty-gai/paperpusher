import { BaseOutputParser } from 'npm:@langchain/core/output_parsers'
import { AgentResponse, CreateTaskPayload, UpdateTaskPayload, UpdateProductPayload } from '../shared/types.ts'

export class AgentOutputParser extends BaseOutputParser<AgentResponse> {
  lc_namespace = ['paperpusher', 'output_parsers']
  userId: string

  constructor(userId: string) {
    super()
    this.userId = userId
  }

  validateTaskPayload(payload: any): boolean {
    if (!payload.title || typeof payload.title !== 'string') {
      console.warn('Task payload missing required title field')
      return false
    }
    if (!payload.assignee_id || typeof payload.assignee_id !== 'string') {
      console.warn('Task payload missing required assignee_id field')
      return false
    }
    return true
  }

  async parse(text: string): Promise<AgentResponse> {
    try {
      // Clean and parse the text
      const cleanedText = text.replace(/```json\n|\n```/g, '').trim()
      let parsed
      try {
        parsed = JSON.parse(cleanedText)
      } catch (e) {
        console.warn('Failed to parse agent output as JSON, returning normal response')
        return this.createNormalResponse(text)
      }

      // Validate response structure
      if (!parsed.type || !parsed.payload) {
        console.warn('Invalid agent output structure, returning normal response')
        return this.createNormalResponse(text)
      }

      // Validate action type and payload
      switch (parsed.type) {
        case 'CREATE_TASK':
          if (!this.validateTaskPayload(parsed.payload)) {
            console.warn('Invalid CREATE_TASK payload, returning normal response')
            return this.createNormalResponse(text)
          }
          break
        case 'UPDATE_TASK':
          if (!parsed.payload.id) {
            console.warn('Invalid UPDATE_TASK payload: missing task ID')
            return this.createNormalResponse(text)
          }
          break
        case 'UPDATE_PRODUCT':
          if (!parsed.payload.id || !parsed.payload.updates) {
            console.warn('Invalid UPDATE_PRODUCT payload, returning normal response')
            return this.createNormalResponse(text)
          }
          break
        case 'NORMAL_RESPONSE':
          break
        default:
          console.warn(`Invalid action type: ${parsed.type}, returning normal response`)
          return this.createNormalResponse(text)
      }

      // Add metadata
      const response: AgentResponse = {
        message: parsed.message || text,
        action: {
          type: parsed.type,
          payload: parsed.payload,
          metadata: {
            userId: this.userId,
            timestamp: new Date().toISOString(),
            status: 'success'
          }
        }
      }

      return response
    } catch (error) {
      console.error('Error parsing agent output:', error)
      return this.createNormalResponse(text)
    }
  }

  private createNormalResponse(text: string): AgentResponse {
    return {
      message: text,
      action: {
        type: 'NORMAL_RESPONSE',
        payload: { message: text },
        metadata: {
          userId: this.userId,
          timestamp: new Date().toISOString(),
          status: 'success'
        }
      }
    }
  }

  getFormatInstructions(): string {
    return `You must respond in JSON format with a message and action.
Example:
{
  "message": "Your response to the user",
  "type": "ACTION_TYPE",
  "payload": {
    // Action-specific payload fields
  }
}`
  }
} 