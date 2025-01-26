import React, { useRef, useState } from "react"
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

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      showingDropdown: showMentions,
      filteredProfilesCount: filteredProfiles.length
    })

    if (currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      console.log("@ detected - Setting search term:", search)
      setSearchTerm(search)
      
      const rect = target.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const newPosition = {
          x: 0,
          y: rect.height
        }
        console.log("Setting dropdown position:", newPosition)
        setMentionAnchor(newPosition)
        setShowMentions(true)
      }
    } else {
      console.log("No @ detected, hiding dropdown")
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (selectedProfile: Profile) => {
    console.log("Selected profile:", selectedProfile)
    const ref = multiline ? textareaRef.current : inputRef.current
    if (!ref) {
      console.error("No input ref available")
      return
    }

    const cursorPosition = ref.selectionStart || 0
    const value = ref.value
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

  const InputComponent = multiline ? Textarea : Input
  const ref = multiline ? textareaRef : inputRef

  return (
    <div className="relative" ref={containerRef}>
      <InputComponent
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className={cn("w-full", className)}
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