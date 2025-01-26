import React, { useRef, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Profile } from "@/types/profiles"
import { cn } from "@/lib/utils"

interface MentionsInputProps {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  className?: string
}

export function MentionsInput({
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
}: MentionsInputProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionAnchor, setMentionAnchor] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const { profiles } = useSelector((state: RootState) => state.profiles)
  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget
    const value = target.value
    const cursorPosition = target.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    console.log("Current word:", currentWord)

    if (currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      setSearchTerm(search)
      
      // Calculate position for the mentions dropdown
      const rect = target.getBoundingClientRect()
      const textBeforeAt = textBeforeCursor.slice(0, textBeforeCursor.lastIndexOf('@'))
      const tempSpan = document.createElement('span')
      tempSpan.style.font = window.getComputedStyle(target).font
      tempSpan.style.visibility = 'hidden'
      tempSpan.style.position = 'absolute'
      tempSpan.textContent = textBeforeAt
      document.body.appendChild(tempSpan)
      const atPosition = tempSpan.getBoundingClientRect().width
      document.body.removeChild(tempSpan)

      setMentionAnchor({
        x: rect.left + atPosition,
        y: rect.bottom
      })
      setShowMentions(true)
      console.log("Showing mentions dropdown", { x: rect.left + atPosition, y: rect.bottom })
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (selectedProfile: Profile) => {
    if (!inputRef.current) return

    const cursorPosition = inputRef.current.selectionStart || 0
    const value = inputRef.current.value
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    const newText = 
      textBeforeCursor.slice(0, lastAtIndex) + 
      `@${selectedProfile.full_name} ` + 
      textAfterCursor

    console.log("Selected profile:", selectedProfile.full_name)
    onChange(newText)
    setShowMentions(false)
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className={cn("relative", className)}>
      <InputComponent
        ref={inputRef}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className="w-full"
      />
      
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
    </div>
  )
}