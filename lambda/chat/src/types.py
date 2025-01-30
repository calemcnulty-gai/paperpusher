from pydantic import BaseModel
from typing import Literal, Dict, Any, Optional, List

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ConfigInfo(BaseModel):
    openai_model: str
    openai_temperature: float
    embedding_model: str
    embedding_dimensions: int
    pinecone_index: Optional[str] = None
    supabase_url: Optional[str] = None

class IntermediateValues(BaseModel):
    raw_request: Optional[Dict[str, Any]] = None
    product_id: Optional[str] = None
    product_fetch_result: Optional[Dict[str, Any]] = None
    raw_messages: Optional[List[Dict[str, Any]]] = None
    formatted_messages: Optional[List[Dict[str, Any]]] = None
    prompt_template: Optional[str] = None
    final_prompt: Optional[str] = None
    last_message: Optional[str] = None

class DebugInfo(BaseModel):
    config: Optional[ConfigInfo] = None
    intermediate_values: Optional[IntermediateValues] = None
    product_context: Optional[Dict[str, Any]] = None
    similarity_results: Optional[list] = None
    query_embedding_size: Optional[int] = None
    errors: Optional[Dict[str, str]] = None
    chain_inputs: Optional[Dict[str, Any]] = None
    execution_step: Optional[str] = None  # Track where in the execution we are 