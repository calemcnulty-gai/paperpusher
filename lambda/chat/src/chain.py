import os
from typing import AsyncIterator, List, Optional, Dict, Any, Tuple
from langchain_core.runnables import RunnableSequence
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Pinecone
from .db import get_supabase_client
from .types import Message, DebugInfo, ConfigInfo, IntermediateValues

# Initialize embeddings
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSIONS = 3072
CHAT_MODEL = "gpt-4-turbo-preview"
CHAT_TEMPERATURE = 0.7

embeddings = OpenAIEmbeddings(
    model=EMBEDDING_MODEL,
    dimensions=EMBEDDING_DIMENSIONS
)

# Initialize chat model
chat = ChatOpenAI(
    model=CHAT_MODEL,
    temperature=CHAT_TEMPERATURE,
    streaming=True
)

SYSTEM_TEMPLATE = SystemMessage(content="""You are a helpful AI assistant for PaperPusher, a document management and product catalog system.
Your role is to help users with their questions about products and documents.

{context}

Guidelines:
1. Be professional and courteous
2. If you don't know something, say so
3. When discussing products, use accurate pricing and details
4. Keep responses focused and relevant""")

class ChatChain:
    def __init__(self):
        self.db = get_supabase_client()
        self.prompt = ChatPromptTemplate.from_messages([
            SYSTEM_TEMPLATE,
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content="{input}")
        ])
        self.chain = RunnableSequence.from_components([
            self.prompt,
            chat,
            StrOutputParser()
        ])
        self.debug_info = DebugInfo(
            config=ConfigInfo(
                openai_model=CHAT_MODEL,
                openai_temperature=CHAT_TEMPERATURE,
                embedding_model=EMBEDDING_MODEL,
                embedding_dimensions=EMBEDDING_DIMENSIONS,
                pinecone_index=os.getenv("PINECONE_INDEX"),
                supabase_url=os.getenv("SUPABASE_PROJECT_URL")
            ),
            intermediate_values=IntermediateValues(),
            execution_step="initialized"
        )
        
    async def _get_relevant_context(self, query: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Get relevant product context using similarity search"""
        self.debug_info.execution_step = "generating_embeddings"
        try:
            query_embedding = await embeddings.aembed_query(query)
            self.debug_info.query_embedding_size = len(query_embedding)
            
            self.debug_info.execution_step = "similarity_search"
            results = await self.db.similarity_search(query_embedding)
            self.debug_info.similarity_results = results
            
            if not results:
                return "", []
                
            context_parts = []
            for result in results:
                context_parts.append(
                    f"Product: {result['name']}\n"
                    f"Description: {result['description']}\n"
                    f"Price: ${result['price']:.2f}\n"
                )
                
            return "\nRelevant products:\n" + "\n".join(context_parts), results
        except Exception as e:
            if not self.debug_info.errors:
                self.debug_info.errors = {}
            self.debug_info.errors[f"context_error_{self.debug_info.execution_step}"] = str(e)
            return "", []
        
    def _format_chat_history(self, messages: List[Message]) -> List[HumanMessage | AIMessage]:
        """Format chat history for the prompt"""
        self.debug_info.execution_step = "formatting_chat_history"
        try:
            formatted_messages = []
            for msg in messages:
                if msg.role == "user":
                    formatted_messages.append(HumanMessage(content=msg.content))
                else:
                    formatted_messages.append(AIMessage(content=msg.content))
            
            if self.debug_info.intermediate_values:
                self.debug_info.intermediate_values.formatted_messages = [
                    {"role": msg.type, "content": msg.content}
                    for msg in formatted_messages
                ]
            
            return formatted_messages
        except Exception as e:
            if not self.debug_info.errors:
                self.debug_info.errors = {}
            self.debug_info.errors["format_chat_history_error"] = str(e)
            raise
        
    async def astream(
        self,
        messages: List[Message],
        context: Optional[str] = None
    ) -> AsyncIterator[Tuple[str, DebugInfo]]:
        try:
            # Reset debug info for new request but keep config
            config = self.debug_info.config
            self.debug_info = DebugInfo(
                config=config,
                intermediate_values=IntermediateValues(
                    raw_messages=[msg.dict() for msg in messages]
                ),
                execution_step="stream_started"
            )
            
            # Get last user message
            last_message = messages[-1].content
            if self.debug_info.intermediate_values:
                self.debug_info.intermediate_values.last_message = last_message
            
            # Get relevant context
            self.debug_info.execution_step = "getting_context"
            product_context = context or ""
            context_results = []
            if not context:
                product_context, context_results = await self._get_relevant_context(last_message)
                
            self.debug_info.product_context = {
                "context_text": product_context,
                "results": context_results
            }
            
            # Format chat history (excluding last message)
            self.debug_info.execution_step = "formatting_history"
            chat_history = self._format_chat_history(messages[:-1])
            
            # Create prompt inputs
            self.debug_info.execution_step = "creating_prompt"
            if self.debug_info.intermediate_values:
                self.debug_info.intermediate_values.prompt_template = str(self.prompt)
            
            prompt_kwargs = {
                "context": product_context,
                "chat_history": chat_history,
                "input": last_message
            }
            
            if self.debug_info.intermediate_values:
                self.debug_info.intermediate_values.final_prompt = str(
                    await self.prompt.ainvoke(prompt_kwargs)
                )
            
            self.debug_info.chain_inputs = prompt_kwargs
            
            # Generate streaming response
            self.debug_info.execution_step = "generating_response"
            async for chunk in self.chain.astream(prompt_kwargs):
                yield chunk, self.debug_info
                
        except Exception as e:
            if not self.debug_info.errors:
                self.debug_info.errors = {}
            self.debug_info.errors[f"stream_error_{self.debug_info.execution_step}"] = str(e)
            # Still yield the debug info even on error
            yield "Error occurred", self.debug_info
            raise

def get_chat_chain() -> ChatChain:
    """Get a new instance of ChatChain"""
    return ChatChain() 