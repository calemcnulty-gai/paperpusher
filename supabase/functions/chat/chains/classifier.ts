import { z } from 'npm:zod'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { StructuredOutputParser } from 'npm:@langchain/core/output_parsers'
import { RunnableSequence } from 'npm:@langchain/core/runnables'
import { chatModel } from '../config/langchain.ts'
import { Message, MessageClassification } from '../../shared/types.ts'
import { formatChatHistory } from '../utils/formatters.ts'

const SYSTEM_TEMPLATE = `You are a message classifier that determines if a message requires an action.

Chat History:
{chat_history}

Current Message: {message}

Analyze if this message requires an action like creating a task, updating a task status, or modifying product information.
Return a structured response with:
- requires_action: boolean indicating if action is needed
- reasoning: brief explanation of your decision
- confidence: number between 0 and 1 indicating confidence in classification

Example actions that require action:
- "Create a task to follow up with supplier"
- "Mark the inventory task as complete"
- "Update the price of SKU-123 to $19.99"

Example messages that don't require action:
- "What products do we have in stock?"
- "Tell me about product SKU-456"
- "Thanks for the help"

Format your response as a JSON object matching the specified structure.`

const outputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    requires_action: z.boolean(),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1)
  })
)

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE)

export async function createClassifierChain() {
  const chain = RunnableSequence.from([
    {
      chat_history: async (input: { messages: Message[] }) => 
        formatChatHistory(input.messages),
      message: (input: { messages: Message[] }) => 
        input.messages[input.messages.length - 1].content
    },
    prompt,
    chatModel,
    outputParser
  ])

  return chain
} 