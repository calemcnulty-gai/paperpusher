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
    console.log("handleKeyUp - Event triggered", {
      key: e.key,
      value: target.value,
      cursorPosition: target.selectionStart
    })

    const value = target.value
    const cursorPosition = target.selectionStart || 0
    
    // Find the word being typed
    const textBeforeCursor = value.slice(0, cursorPosition)
    const words = textBeforeCursor.split(/\s/)
    const currentWord = words[words.length - 1]

    console.log("handleKeyUp - Text analysis", {
      textBeforeCursor,
      words,
      currentWord,
      startsWithAt: currentWord.startsWith("@")
    })

    if (currentWord.startsWith("@")) {
      const search = currentWord.slice(1)
      console.log("handleKeyUp - Mention detected", { search })
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
      
      const newAnchorPoint = {
        x: rect.left + atPosition,
        y: rect.top + rect.height
      }
      
      console.log("handleKeyUp - Popover positioning", {
        rect,
        textBeforeAt,
        atPosition,
        newAnchorPoint
      })

      setAnchorPoint(newAnchorPoint)
      setShowMentions(true)
      
      console.log("handleKeyUp - Fetching profiles")
      dispatch(fetchProfiles() as any)
    } else {
      console.log("handleKeyUp - No @ symbol detected, hiding mentions")
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (selectedUser: Profile) => {
    console.log("handleMentionSelect - User selected", {
      userId: selectedUser.id,
      fullName: selectedUser.full_name
    })
    
    const text = `@${selectedUser.full_name} `
    console.log("handleMentionSelect - Generated mention text", { text })
    
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