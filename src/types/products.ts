import { Json } from "@/integrations/supabase/types"

export interface Product {
  id: string
  name: string | null
  sku: string | null
  brand: string | null
  category: string | null
  size: string | null
  color: string | null
  material: string | null
  wholesale_price: number | null
  retail_price: number | null
  supplier_id: string | null
  stock_quantity: number | null
  description: string | null
  specifications: Json | null
  created_at: string
  updated_at: string
  season: string | null
  image_url: string | null
  profiles?: {
    full_name: string | null
  }
  document_id: string | null
  extracted_metadata: Json | null
  processing_status: string | null
  product_number: string | null
}