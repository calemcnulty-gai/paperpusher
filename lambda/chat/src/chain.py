import os
from typing import AsyncIterator, List, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema.messages import HumanMessage, AIMessage
from langchain.schema.output import ChatGenerationChunk
from .db import get_supabase_client
from .types import Message

# Initialize embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=3072  # Using full dimensions for better accuracy
)

# Initialize chat model
chat = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0.7,
    streaming=True
)

SYSTEM_TEMPLATE = """You are a helpful AI assistant for PaperPusher, a document management and product catalog system.
Your role is to help users with their questions about products and documents.

{context}

Guidelines:
1. Be professional and courteous
2. If you don't know something, say so
3. When discussing products, use accurate pricing and details
4. Keep responses focused and relevant

Current conversation:
{chat_history}

User: {input}
Assistant: """

class ChatChain:
    def __init__(self):
        self.db = get_supabase_client()
        self.prompt = ChatPromptTemplate.from_template(SYSTEM_TEMPLATE)
        
    async def _get_relevant_context(self, query: str) -> str:
        """Get relevant product context using similarity search"""
        query_embedding = embeddings.embed_query(query)
        results = await self.db.similarity_search(query_embedding)
        
        if not results:
            return ""
            
        context_parts = []
        for result in results:
            context_parts.append(
                f"Product: {result['name']}\n"
                f"Description: {result['description']}\n"
                f"Price: ${result['price']:.2f}\n"
            )
            
        return "\nRelevant products:\n" + "\n".join(context_parts)
        
    def _format_chat_history(self, messages: List[Message]) -> str:
        """Format chat history for the prompt"""
        formatted = []
        for msg in messages:
            role = "User" if msg.role == "user" else "Assistant"
            formatted.append(f"{role}: {msg.content}")
        return "\n".join(formatted)
        
    async def astream(
        self,
        messages: List[Message],
        context: Optional[str] = None
    ) -> AsyncIterator[ChatGenerationChunk]:
        # Get last user message
        last_message = messages[-1].content
        
        # Get relevant context
        product_context = context or ""
        if not context:
            product_context = await self._get_relevant_context(last_message)
            
        # Format chat history (excluding last message)
        chat_history = self._format_chat_history(messages[:-1])
        
        # Create prompt
        prompt_value = self.prompt.format_messages(
            context=product_context,
            chat_history=chat_history,
            input=last_message
        )
        
        # Generate streaming response
        async for chunk in chat.astream(prompt_value):
            yield chunk

def get_chat_chain() -> ChatChain:
    """Get a new instance of ChatChain"""
    return ChatChain() 