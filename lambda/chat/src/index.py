from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from mangum import Mangum
from pydantic import BaseModel
from typing import List, Optional
import json
import os

from chain import get_chat_chain
from db import get_supabase_client
from types import Message, DebugInfo, IntermediateValues

app = FastAPI()

class ChatRequest(BaseModel):
    messages: List[Message]
    product_id: Optional[str] = None
    
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Initialize debug info at endpoint level
    endpoint_debug = DebugInfo(
        execution_step="endpoint_start",
        intermediate_values=IntermediateValues(
            raw_request=request.dict(),
            product_id=request.product_id
        )
    )
    
    try:
        # Initialize chain and DB client
        endpoint_debug.execution_step = "initializing_clients"
        chain = get_chat_chain()
        supabase = get_supabase_client()
        
        # Track debug info across chunks
        debug_info = chain.debug_info  # Start with chain's debug info
        
        async def generate_response():
            nonlocal debug_info
            endpoint_debug.execution_step = "generate_response_started"
            
            # Get product context if product_id is provided
            product_context = ""
            try:
                if request.product_id:
                    endpoint_debug.execution_step = "fetching_product"
                    product = await supabase.get_product(request.product_id)
                    if product:
                        endpoint_debug.intermediate_values.product_fetch_result = product
                        product_context = f"Product context: {json.dumps(product)}\n"
            except Exception as e:
                endpoint_debug.execution_step = "product_fetch_error"
                if endpoint_debug.errors is None:
                    endpoint_debug.errors = {}
                endpoint_debug.errors["product_fetch_error"] = str(e)
                # Don't raise, continue without product context
            
            # Generate streaming response
            try:
                endpoint_debug.execution_step = "streaming_started"
                async for content, chunk_debug in chain.astream(
                    messages=request.messages,
                    context=product_context
                ):
                    debug_info = chunk_debug  # Update debug info with latest
                    # Merge endpoint debug info
                    if debug_info and debug_info.intermediate_values:
                        debug_info.intermediate_values.raw_request = endpoint_debug.intermediate_values.raw_request
                        debug_info.intermediate_values.product_fetch_result = endpoint_debug.intermediate_values.product_fetch_result
                    if debug_info and endpoint_debug.errors:
                        if not debug_info.errors:
                            debug_info.errors = {}
                        debug_info.errors.update(endpoint_debug.errors)
                    
                    if content:
                        response_data = {
                            "content": content,
                            "debug": debug_info.dict(exclude_none=True) if debug_info else None
                        }
                        yield f"data: {json.dumps(response_data)}\n\n"
            except Exception as e:
                endpoint_debug.execution_step = "streaming_error"
                if not debug_info:
                    debug_info = endpoint_debug
                if debug_info.errors is None:
                    debug_info.errors = {}
                debug_info.errors["stream_error"] = str(e)
                response_data = {
                    "error": str(e),
                    "debug": debug_info.dict(exclude_none=True)
                }
                yield f"data: {json.dumps(response_data)}\n\n"
                    
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        endpoint_debug.execution_step = "endpoint_error"
        if endpoint_debug.errors is None:
            endpoint_debug.errors = {}
        endpoint_debug.errors["endpoint_error"] = str(e)
        raise HTTPException(
            status_code=500, 
            detail={
                "error": str(e),
                "debug": endpoint_debug.dict(exclude_none=True)
            }
        )

# Create handler for AWS Lambda
handler = Mangum(app) 