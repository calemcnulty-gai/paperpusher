import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { StructuredOutputParser } from 'npm:@langchain/core/output_parsers'
import { RunnableSequence } from 'npm:@langchain/core/runnables'
import { chatModel } from '../config/langchain.ts'
import { Message, Action, ActionType, CreateTaskPayload, UpdateTaskPayload, UpdateProductPayload } from '../../shared/types.ts'
import { formatChatHistory } from '../utils/formatters.ts'
import { AgentOutputParser } from '../AgentOutputParser.ts'

const SYSTEM_TEMPLATE = `You are an action generator that creates structured actions based on user messages.

Chat History:
{chat_history}

Current Message: {message}
User Role: {user_role}
User ID: {user_id}

Generate a structured action based on the user's message. Valid action types are:
- CREATE_TASK: For creating new tasks (reminders, follow-ups, etc.)
- UPDATE_TASK: For updating task status or properties of existing tasks
- UPDATE_PRODUCT: For modifying product information
- NORMAL_RESPONSE: For messages that don't require specific actions

For task creation:
1. Extract a clear title from the user's request
2. Generate a descriptive description if context is available
3. Set an appropriate priority based on urgency words
4. Always use the provided User ID as the assignee_id
5. For reminders and time-based tasks, include the timing in the description

For task updates:
1. When updating a task referenced in the conversation (e.g., "make that task high priority"), extract the task ID from the most recent task-related action in the chat history
2. Task IDs are UUIDs that look like "ed648574-e48d-4793-93da-6ac3c96a9d08"
3. The task ID will be in the previous assistant message in the format: 'Task "X" created successfully.' followed by action data containing the ID
4. Include both the task ID and the specific updates in the payload
5. For priority updates, use one of: "low", "medium", "high"
6. For status updates, use one of: "pending", "in_progress", "completed"

Example Actions:
1. Create Task (for "remind me to call Joe on Friday"):
{{
  "type": "CREATE_TASK",
  "payload": {{
    "title": "Call Joe",
    "description": "Scheduled for Friday",
    "priority": "medium",
    "assignee_id": "{user_id}"
  }},
  "metadata": {{
    "userId": "{user_id}",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }}
}}

2. Update Task (for "make that task high priority" after a task was just created):
{{
  "type": "UPDATE_TASK",
  "payload": {{
    "id": "ed648574-e48d-4793-93da-6ac3c96a9d08",  // Extract this ID from the chat history
    "priority": "high"
  }},
  "metadata": {{
    "userId": "{user_id}",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }}
}}

3. Update Task Status (for "mark that task as done" after a task was just created):
{{
  "type": "UPDATE_TASK",
  "payload": {{
    "id": "ed648574-e48d-4793-93da-6ac3c96a9d08",  // Extract this ID from the chat history
    "status": "completed"
  }},
  "metadata": {{
    "userId": "{user_id}",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }}
}}

4. Update Product:
{{
  "type": "UPDATE_PRODUCT",
  "payload": {{
    "id": "prod_123",
    "updates": {{
      "price": 19.99,
      "stock": 100
    }}
  }},
  "metadata": {{
    "userId": "{user_id}",
    "timestamp": "2024-01-31T20:00:02.738Z",
    "status": "success"
  }}
}}

Format your response as a JSON object matching the specified structure.
Only generate actions that the user has permission to perform based on their role.
Principal users can perform any action, regular users can only create and update tasks.
Always ensure task payloads include both title and assignee_id fields.
IMPORTANT: 
1. Always use the provided User ID for assignee_id and metadata.userId, not the role.
2. When updating a task, you MUST extract the task ID from the most recent task-related action in the chat history.
3. For task updates like "make that task high priority", look at the chat history to find the task that was just created or last mentioned.
4. Task IDs are UUIDs that look like "ed648574-e48d-4793-93da-6ac3c96a9d08" - never use placeholder IDs.`

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
      status: z.enum(['pending', 'in_progress', 'completed']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional()
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
      user_role: (input: { userRole: string }) => input.userRole,
      user_id: (input: { userId: string }) => input.userId
    },
    prompt,
    chatModel,
    outputParser
  ])

  return chain
} 