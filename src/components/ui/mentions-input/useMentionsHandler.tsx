import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Profile } from "@/types/profiles"
import { supabase } from "@/integrations/supabase/client"

interface Product {
  id: string
  name: string
  sku: string
}

interface UseMentionsHandlerProps {
  value: string
  onChange: (value: string) => void
  disableUserMentions?: boolean
  disableProductMentions?: boolean
}

export function useMentionsHandler({
  value,
  onChange,
  disableUserMentions = false,
  disableProductMentions = false,
}: UseMentionsHandlerProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [mentionAnchor, setMentionAnchor] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const navigate = useNavigate()

  const handleKeyUp = async (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    containerRef: React.RefObject<HTMLDivElement>
  ) => {
    const target = e.currentTarget
    const value = target.value
    const cursorPosition = target.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    if (!disableUserMentions && currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      setSearchTerm(search)
      setShowMentions(true)
      setShowProducts(false)
      
      const rect = target.getBoundingClientRect()
      if (containerRef.current) {
        setMentionAnchor({
          x: 0,
          y: rect.height
        })
      }
    } else if (!disableProductMentions && currentWord.startsWith("#")) {
      const search = currentWord.slice(1)
      setSearchTerm(search)
      setShowMentions(false)
      setShowProducts(true)

      const { data } = await supabase
        .from("products")
        .select("id, name, sku")
        .ilike("name", `%${search}%`)
        .limit(5)

      setProducts(data || [])
      
      const rect = target.getBoundingClientRect()
      if (containerRef.current) {
        setMentionAnchor({
          x: 0,
          y: rect.height
        })
      }
    } else {
      setShowMentions(false)
      setShowProducts(false)
    }
  }

  const handleMentionSelect = (selectedProfile: Profile) => {
    const cursorPosition = getCursorPosition()
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    const newText = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      `@${selectedProfile.full_name} ` + 
      textAfterCursor

    onChange(newText)
    setShowMentions(false)
    navigate(`/${selectedProfile.role}s/${selectedProfile.id}`)
  }

  const handleProductSelect = (selectedProduct: Product) => {
    const cursorPosition = getCursorPosition()
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    
    const newText = 
      textBeforeCursor.slice(0, lastHashIndex) + 
      `#${selectedProduct.name} ` + 
      textAfterCursor

    onChange(newText)
    setShowProducts(false)
    navigate(`/products/${selectedProduct.id}`)
  }

  const getCursorPosition = () => {
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement
    return activeElement?.selectionStart || 0
  }

  return {
    showMentions,
    showProducts,
    mentionAnchor,
    searchTerm,
    products,
    handleKeyUp,
    handleMentionSelect,
    handleProductSelect,
  }
}