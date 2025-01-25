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
  console.log("UserMentionsPopover - Render", {
    open,
    anchorPoint,
    searchTerm
  })

  const { profiles } = useSelector((state: RootState) => state.profiles)
  console.log("UserMentionsPopover - Available profiles", profiles)
  
  const filteredUsers = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  console.log("UserMentionsPopover - Filtered users", filteredUsers)

  const handleSelect = (value: string) => {
    console.log("UserMentionsPopover - CommandItem onSelect triggered", { value })
    
    const selectedUser = filteredUsers.find(user => user.full_name === value)
    console.log("UserMentionsPopover - Found selected user", selectedUser)
    
    if (selectedUser) {
      console.log("UserMentionsPopover - Calling onUserSelect with user", {
        userId: selectedUser.id,
        fullName: selectedUser.full_name
      })
      onUserSelect(selectedUser)
      onOpenChange(false) // Close the popover after selection
    }
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
        onPointerDownOutside={(e) => {
          console.log("UserMentionsPopover - Pointer down outside", e)
        }}
        onInteractOutside={(e) => {
          console.log("UserMentionsPopover - Interact outside", e)
          e.preventDefault() // Prevent the popover from closing on interaction
        }}
      >
        <Command>
          <CommandInput 
            placeholder="Search users..." 
            value={searchTerm}
            onValueChange={(value) => {
              console.log("UserMentionsPopover - Search value changed", { value })
              onSearchChange(value)
            }}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.full_name || ""}
                  onSelect={handleSelect}
                  className="cursor-pointer"
                  onPointerDown={(e) => {
                    console.log("UserMentionsPopover - CommandItem pointer down", {
                      userId: user.id,
                      fullName: user.full_name
                    })
                    e.preventDefault() // Prevent the input from losing focus
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">{user.full_name}</span>
                    <span className="text-muted-foreground">@{user.email.split('@')[0]}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}