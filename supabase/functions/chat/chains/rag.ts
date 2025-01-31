import { RunnableSequence } from 'npm:@langchain/core/runnables'
import { StringOutputParser } from 'npm:@langchain/core/output_parsers'
import { PromptTemplate } from 'npm:@langchain/core/prompts'
import { Document } from 'npm:@langchain/core/documents'
import { chatModel } from '../config/langchain.ts'
import { retriever1, retriever2 } from '../config/pinecone.ts'
import { formatChatHistory, formatProductContext } from '../utils/formatters.ts'
import { Message } from '../../shared/types.ts'

const SYSTEM_TEMPLATE = `You are a helpful product assistant. Use the following product information and chat history to provide accurate and helpful responses about products.

Product Context:
{context}

Chat History:
{chat_history}

Current Question: {question}

Respond in a natural, conversational way. If you don't have enough information to answer accurately, say so.
If the user asks about a product not mentioned in the context, let them know you can only discuss products in the provided context.`

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE)

async function combineProductContext(docs: Document[]): Promise<string> {
  return docs.map(doc => formatProductContext(doc)).join('\n')
}

export async function createRagChain() {
  const chain = RunnableSequence.from([
    {
      // Parallel retrieval from both indexes
      context: async (input: { question: string; chat_history: Message[] }) => {
        const [results1, results2] = await Promise.all([
          retriever1.getRelevantDocuments(input.question),
          retriever2.getRelevantDocuments(input.question)
        ])
        const combinedDocs = [...results1, ...results2]
        return combineProductContext(combinedDocs)
      },
      chat_history: async (input: { chat_history: Message[] }) => 
        formatChatHistory(input.chat_history),
      question: (input: { question: string }) => input.question
    },
    prompt,
    chatModel,
    new StringOutputParser()
  ])

  return chain
} 