import React, { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Profile } from "@/types/profiles"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"

interface MentionsInputProps {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  className?: string
  disableUserMentions?: boolean
  disableProductMentions?: boolean
}

interface Product {
  id: string
  name: string
  sku: string
}

export function MentionsInput({
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
  disableUserMentions = false,
  disableProductMentions = false,
}: MentionsInputProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [mentionAnchor, setMentionAnchor] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { profiles } = useSelector((state: RootState) => {
    console.log("Redux state:", state)
    console.log("Profiles in state:", state.profiles)
    return state.profiles
  })

  const filteredProfiles = profiles.filter(profile => {
    const matches = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    console.log(`Filtering profile ${profile.full_name}: ${matches ? 'matches' : 'no match'} for term "${searchTerm}"`)
    return matches
  })

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget
    const value = target.value
    const cursorPosition = target.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    console.log("Input event:", {
      value,
      cursorPosition,
      textBeforeCursor,
      words,
      currentWord,
      showingDropdown: showMentions || showProducts,
    })

    if (!disableUserMentions && currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      console.log("@ detected - Setting search term:", search)
      setSearchTerm(search)
      setShowMentions(true)
      setShowProducts(false)
      
      const rect = target.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const newPosition = {
          x: 0,
          y: rect.height
        }
        console.log("Setting dropdown position:", newPosition)
        setMentionAnchor(newPosition)
      }
    } else if (!disableProductMentions && currentWord.startsWith("#")) {
      const search = currentWord.slice(1)
      console.log("# detected - Setting search term:", search)
      setSearchTerm(search)
      setShowMentions(false)
      setShowProducts(true)

      // Fetch products when # is typed
      const { data } = await supabase
        .from("products")
        .select("id, name, sku")
        .ilike("name", `%${search}%`)
        .limit(5)

      setProducts(data || [])
      
      const rect = target.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const newPosition = {
          x: 0,
          y: rect.height
        }
        console.log("Setting dropdown position:", newPosition)
        setMentionAnchor(newPosition)
      }
    } else {
      console.log("No @ or # detected, hiding dropdowns")
      setShowMentions(false)
      setShowProducts(false)
    }
  }

  const handleMentionSelect = (selectedProfile: Profile) => {
    console.log("Selected profile:", selectedProfile)
    const currentRef = multiline ? textareaRef.current : inputRef.current
    if (!currentRef) {
      console.error("No input ref available")
      return
    }

    const cursorPosition = currentRef.selectionStart || 0
    const value = currentRef.value
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    console.log("Mention selection:", {
      cursorPosition,
      textBeforeCursor,
      textAfterCursor,
      lastAtIndex
    })

    const newText = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      `@${selectedProfile.full_name} ` + 
      textAfterCursor

    console.log("New text after mention:", newText)
    onChange(newText)
    setShowMentions(false)
  }

  const handleProductSelect = (selectedProduct: Product) => {
    console.log("Selected product:", selectedProduct)
    const currentRef = multiline ? textareaRef.current : inputRef.current
    if (!currentRef) {
      console.error("No input ref available")
      return
    }

    const cursorPosition = currentRef.selectionStart || 0
    const value = currentRef.value
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastHashIndex = textBeforeCursor.lastIndexOf("#")
    
    const newText = 
      textBeforeCursor.slice(0, lastHashIndex) + 
      `#${selectedProduct.name} ` + 
      textAfterCursor

    console.log("New text after product mention:", newText)
    onChange(newText)
    setShowProducts(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {multiline ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          className={cn("w-full", className)}
        />
      ) : (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          className={cn("w-full", className)}
        />
      )}
      {showMentions && filteredProfiles.length > 0 && (
        <div
          className="absolute z-50 w-64 bg-white border rounded-md shadow-lg"
          style={{
            left: `${mentionAnchor.x}px`,
            top: `${mentionAnchor.y}px`,
          }}
        >
          <div className="py-1">
            {filteredProfiles.map((profile) => (
              <button
                key={profile.id}
                className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleMentionSelect(profile)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{profile.full_name}</span>
                  <span className="text-muted-foreground">
                    @{profile.email?.split('@')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {showProducts && filteredProducts.length > 0 && (
        <div
          className="absolute z-50 w-64 bg-white border rounded-md shadow-lg"
          style={{
            left: `${mentionAnchor.x}px`,
            top: `${mentionAnchor.y}px`,
          }}
        >
          <div className="py-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted-foreground">
                    #{product.sku}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}