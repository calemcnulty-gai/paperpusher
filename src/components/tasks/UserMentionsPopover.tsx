import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Profile } from "@/types/profiles"
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
                  onSelect={() => onUserSelect(user)}
                  className="cursor-pointer"
                >
                  {user.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}