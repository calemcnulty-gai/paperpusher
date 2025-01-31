import { BaseOutputParser } from 'npm:@langchain/core/output_parsers'
import { AgentResponse } from './types.ts'

export class AgentOutputParser extends BaseOutputParser<AgentResponse> {
  lc_namespace = ['paperpusher', 'output_parsers']

  async parse(text: string): Promise<AgentResponse> {
    try {
      // Clean and parse the text
      const cleanedText = text.replace(/```json\n|\n```/g, '').trim()
      let parsed
      try {
        parsed = JSON.parse(cleanedText)
      } catch (e) {
        console.warn('Failed to parse agent output as JSON, returning normal response')
        return {
          message: text,
          action: {
            type: 'NORMAL_RESPONSE',
            payload: { message: text },
            metadata: {
              userId: '',
              timestamp: new Date().toISOString(),
              status: 'success'
            }
          }
        }
      }

      // Validate response structure
      if (!parsed.message || !parsed.action || !parsed.action.type) {
        console.warn('Invalid agent output structure, returning normal response')
        return {
          message: text,
          action: {
            type: 'NORMAL_RESPONSE',
            payload: { message: text },
            metadata: {
              userId: '',
              timestamp: new Date().toISOString(),
              status: 'success'
            }
          }
        }
      }

      // Validate action type
      const validTypes = ['CREATE_TASK', 'UPDATE_TASK', 'UPDATE_PRODUCT', 'NORMAL_RESPONSE']
      if (!validTypes.includes(parsed.action.type)) {
        console.warn(`Invalid action type: ${parsed.action.type}, returning normal response`)
        return {
          message: text,
          action: {
            type: 'NORMAL_RESPONSE',
            payload: { message: text },
            metadata: {
              userId: '',
              timestamp: new Date().toISOString(),
              status: 'success'
            }
          }
        }
      }

      // Add metadata to the action
      parsed.action.metadata = {
        userId: '',
        timestamp: new Date().toISOString(),
        status: 'success'
      }

      return parsed
    } catch (error) {
      console.error('Error parsing agent output:', error)
      // If parsing fails, return a normal response with the raw text
      return {
        message: text,
        action: {
          type: 'NORMAL_RESPONSE',
          status: 'error',
          data: null
        }
      }
    }
  }

  getFormatInstructions(): string {
    return `You must respond in JSON format with a message and optional action.
Example:
{
  "message": "Your response to the user",
  "action": {
    "type": "ACTION_TYPE",
    "payload": { ... }
  }
}`
  }
} 