import { z } from 'npm:zod'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { StructuredOutputParser } from 'npm:@langchain/core/output_parsers'
import { RunnableSequence } from 'npm:@langchain/core/runnables'
import { chatModel } from '../config/langchain.ts'
import { Message, Action, ActionType, CreateTaskPayload, UpdateTaskPayload, UpdateProductPayload } from '../../shared/types.ts'
import { formatChatHistory } from '../utils/formatters.ts'

const SYSTEM_TEMPLATE = `You are an action generator that creates structured actions based on user messages.

Chat History:
{chat_history}

Current Message: {message}
User Role: {user_role}

Generate a structured action based on the user's message. Valid action types are:
- CREATE_TASK: For creating new tasks
- UPDATE_TASK: For updating task status
- UPDATE_PRODUCT: For modifying product information
- NORMAL_RESPONSE: For messages that don't require specific actions

Each action must include:
- type: The action type
- payload: Relevant data for the action
- metadata: Including userId and timestamp

Example Actions:
1. Create Task:
{
  "type": "CREATE_TASK",
  "payload": {
    "title": "Follow up with supplier",
    "description": "Contact supplier about order #123",
    "priority": "high",
    "assignee_id": "user-123"
  },
  "metadata": {
    "userId": "user-123",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }
}

2. Update Task:
{
  "type": "UPDATE_TASK",
  "payload": {
    "id": "task-123",
    "status": "completed"
  },
  "metadata": {
    "userId": "user-123",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }
}

3. Update Product:
{
  "type": "UPDATE_PRODUCT",
  "payload": {
    "id": "prod-123",
    "updates": {
      "price": 19.99,
      "stock": 100
    }
  },
  "metadata": {
    "userId": "user-123",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }
}

Format your response as a JSON object matching the specified structure.
Only generate actions that the user has permission to perform based on their role.
Principal users can perform any action, regular users can only create and update tasks.`

const actionPayloadSchema = z.object({
  type: z.enum(['CREATE_TASK', 'UPDATE_TASK', 'UPDATE_PRODUCT', 'NORMAL_RESPONSE']),
  payload: z.union([
    z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      assignee_id: z.string()
    }),
    z.object({
      id: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed'])
    }),
    z.object({
      id: z.string(),
      updates: z.record(z.any())
    }),
    z.object({
      message: z.string().optional()
    })
  ]),
  metadata: z.object({
    userId: z.string(),
    timestamp: z.string(),
    status: z.enum(['success', 'error'])
  })
})

const outputParser = StructuredOutputParser.fromZodSchema(actionPayloadSchema)

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE)

export async function createAgentChain() {
  const chain = RunnableSequence.from([
    {
      chat_history: async (input: { messages: Message[]; userId: string; userRole: string }) => 
        formatChatHistory(input.messages),
      message: (input: { messages: Message[] }) => 
        input.messages[input.messages.length - 1].content,
      user_role: (input: { userRole: string }) => input.userRole
    },
    prompt,
    chatModel,
    outputParser
  ])

  return chain
} 