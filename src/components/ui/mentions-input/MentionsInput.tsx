import React, { useRef, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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

    if (currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      setSearchTerm(search)
      
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
        y: rect.top + rect.height
      })
      setShowMentions(true)
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

    onChange(newText)
    setShowMentions(false)
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className={cn("relative", className)}>
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className="w-full"
      />
      
      {showMentions && (
        <Select
          open={showMentions}
          onOpenChange={setShowMentions}
          onValueChange={(value) => {
            const selectedProfile = profiles.find(p => p.id === value)
            if (selectedProfile) {
              handleMentionSelect(selectedProfile)
            }
          }}
        >
          <SelectContent
            style={{
              position: 'absolute',
              left: `${mentionAnchor.x}px`,
              top: `${mentionAnchor.y}px`,
              width: '250px'
            }}
          >
            {filteredProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{profile.full_name}</span>
                  <span className="text-muted-foreground">
                    @{profile.email.split('@')[0]}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}