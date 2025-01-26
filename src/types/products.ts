export interface Product {
  id: string
  name: string
  sku: string
  brand: string | null
  category: string | null
  size: string | null
  color: string | null
  material: string | null
  price: number | null
  supplier_id: string | null
  stock_quantity: number | null
  description: string | null
  specifications: Record<string, any> | null
  created_at: string
  updated_at: string
  season: string
  profiles?: {
    full_name: string
  }
}