import { useState, useRef, RefObject } from "react"
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
      const caretCoords = getCaretCoordinates(target, cursorPosition)
      
      setAnchorPoint({
        x: rect.left + caretCoords.left,
        y: rect.top + caretCoords.top + 20
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

function getCaretCoordinates(element: HTMLElement, position: number) {
  const { offsetLeft: left, offsetTop: top } = element
  return { left, top }
}