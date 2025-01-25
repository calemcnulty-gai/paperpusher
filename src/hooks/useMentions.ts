import { useState, useRef } from "react"
import { Profile } from "@/types/profiles"
import { useDispatch } from "react-redux"
import { fetchProfiles } from "@/store/profilesSlice"

interface UseMentionsProps {
  onMentionSelect: (text: string) => void
}

export function useMentions({ onMentionSelect }: UseMentionsProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const dispatch = useDispatch()

  const handleKeyUp = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    target: HTMLInputElement | HTMLTextAreaElement
  ) => {
    const value = target.value
    const cursorPosition = target.selectionStart || 0
    
    // Find the word being typed
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    if (currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      setSearchTerm(search)
      
      // Get position for popover
      const rect = target.getBoundingClientRect()
      
      // Calculate text width up to the @ symbol
      const textBeforeAt = textBeforeCursor.slice(0, textBeforeCursor.lastIndexOf('@'))
      const tempSpan = document.createElement('span')
      tempSpan.style.font = window.getComputedStyle(target).font
      tempSpan.style.visibility = 'hidden'
      tempSpan.style.position = 'absolute'
      tempSpan.textContent = textBeforeAt
      document.body.appendChild(tempSpan)
      const atPosition = tempSpan.getBoundingClientRect().width
      document.body.removeChild(tempSpan)
      
      // Set position next to the @ symbol
      setAnchorPoint({
        x: rect.left + atPosition,
        y: rect.top + rect.height
      })
      
      setShowMentions(true)
      // Fetch profiles if not already loaded
      dispatch(fetchProfiles() as any)
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (selectedUser: Profile) => {
    const text = `@${selectedUser.full_name} `
    onMentionSelect(text)
    setShowMentions(false)
  }

  return {
    showMentions,
    setShowMentions,
    anchorPoint,
    searchTerm,
    setSearchTerm,
    handleKeyUp,
    handleMentionSelect,
  }
}