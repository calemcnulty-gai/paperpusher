import os
from typing import List, Dict, Any
from supabase import create_client, Client

class SupabaseClient:
    def __init__(self):
        url = os.environ["SUPABASE_PROJECT_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.client: Client = create_client(url, key)
        
    async def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get product details by ID"""
        response = await self.client.table("products").select("*").eq("id", product_id).execute()
        if not response.data:
            return None
        return response.data[0]
        
    async def similarity_search(self, query_embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        """Search for similar products using vector similarity"""
        response = await self.client.rpc(
            "match_products",
            {
                "query_embedding": query_embedding,
                "match_count": top_k
            }
        ).execute()
        
        return response.data if response.data else []

_client = None

def get_supabase_client() -> SupabaseClient:
    """Get or create Supabase client singleton"""
    global _client
    if _client is None:
        _client = SupabaseClient()
    return _client 