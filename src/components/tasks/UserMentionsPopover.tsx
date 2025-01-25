import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Profile } from "@/types/profiles"
import { Link } from "react-router-dom"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
} from "@/components/ui/popover"

interface UserMentionsPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorPoint: { x: number; y: number }
  searchTerm: string
  onSearchChange: (value: string) => void
  onUserSelect: (user: Profile) => void
}

export function UserMentionsPopover({
  open,
  onOpenChange,
  anchorPoint,
  searchTerm,
  onSearchChange,
  onUserSelect,
}: UserMentionsPopoverProps) {
  const { profiles } = useSelector((state: RootState) => state.profiles)
  
  const filteredUsers = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserClick = (e: React.MouseEvent, user: Profile) => {
    if (e.ctrlKey || e.metaKey) {
      // If Ctrl/Cmd is pressed, let the Link handle navigation
      return
    }
    e.preventDefault()
    onUserSelect(user)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent 
        className="p-0" 
        style={{
          position: 'fixed',
          left: `${anchorPoint.x}px`,
          top: `${anchorPoint.y}px`,
          width: '250px'
        }}
      >
        <Command>
          <CommandInput 
            placeholder="Search users..." 
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  className="cursor-pointer"
                >
                  <Link
                    to={`/users/${user.id}`}
                    className="flex-1 hover:text-primary"
                    onClick={(e) => handleUserClick(e, user)}
                  >
                    {user.full_name}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}