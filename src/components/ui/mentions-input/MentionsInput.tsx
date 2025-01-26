import React, { useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { cn } from "@/lib/utils"
import { MentionDropdown } from "./MentionDropdown"
import { useMentionsHandler } from "./useMentionsHandler"

interface MentionsInputProps {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  className?: string
  disableUserMentions?: boolean
  disableProductMentions?: boolean
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { profiles } = useSelector((state: RootState) => state.profiles)

  const {
    showMentions,
    showProducts,
    mentionAnchor,
    searchTerm,
    products,
    handleKeyUp,
    handleMentionSelect,
    handleProductSelect,
  } = useMentionsHandler({
    value,
    onChange,
    disableUserMentions,
    disableProductMentions,
  })

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative" ref={containerRef}>
      {multiline ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => handleKeyUp(e, containerRef)}
          placeholder={placeholder}
          className={cn("w-full", className)}
        />
      ) : (
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => handleKeyUp(e, containerRef)}
          placeholder={placeholder}
          className={cn("w-full", className)}
        />
      )}

      {showMentions && filteredProfiles.length > 0 && (
        <MentionDropdown
          items={filteredProfiles}
          type="user"
          onSelect={handleMentionSelect}
          position={mentionAnchor}
        />
      )}

      {showProducts && filteredProducts.length > 0 && (
        <MentionDropdown
          items={filteredProducts}
          type="product"
          onSelect={handleProductSelect}
          position={mentionAnchor}
        />
      )}
    </div>
  )
}