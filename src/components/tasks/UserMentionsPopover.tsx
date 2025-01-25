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
        className="p-0 w-[250px]" 
        style={{
          position: 'absolute',
          left: `${anchorPoint.x}px`,
          top: `${anchorPoint.y}px`,
        }}
        align="start"
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
                  className="cursor-pointer hover:bg-accent"
                  onSelect={() => onUserSelect(user)}
                >
                  <Link
                    to={`/users/${user.id}`}
                    className="flex items-center gap-2 w-full text-sm"
                    onClick={(e) => handleUserClick(e, user)}
                  >
                    <span className="font-medium">{user.full_name}</span>
                    <span className="text-muted-foreground">@{user.email.split('@')[0]}</span>
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