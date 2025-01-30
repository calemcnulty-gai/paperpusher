from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from mangum import Mangum
from pydantic import BaseModel
from typing import List, Optional
import json

from .chain import get_chat_chain
from .db import get_supabase_client
from .types import Message

app = FastAPI()

class ChatRequest(BaseModel):
    messages: List[Message]
    product_id: Optional[str] = None
    
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Initialize chain and DB client
        chain = get_chat_chain()
        supabase = get_supabase_client()
        
        async def generate_response():
            # Get product context if product_id is provided
            product_context = ""
            if request.product_id:
                product = await supabase.get_product(request.product_id)
                if product:
                    product_context = f"Product context: {json.dumps(product)}\n"
            
            # Generate streaming response
            async for chunk in chain.astream(
                messages=request.messages,
                context=product_context
            ):
                if chunk.content:
                    yield f"data: {json.dumps({'content': chunk.content})}\n\n"
                    
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create handler for AWS Lambda
handler = Mangum(app) 