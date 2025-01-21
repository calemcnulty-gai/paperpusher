import { Profile } from "@/types/profiles"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TeamMemberForm } from "./TeamMemberForm"
import { useAddTeamMember } from "@/hooks/useAddTeamMember"

export interface AddTeamMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  availableUsers: Profile[]
  teamId: string
}

export function AddTeamMemberDialog({ 
  isOpen, 
  onClose, 
  availableUsers, 
  teamId 
}: AddTeamMemberDialogProps) {
  const {
    selectedUserId,
    setSelectedUserId,
    role,
    setRole,
    handleSubmit,
  } = useAddTeamMember(teamId, onClose)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        <TeamMemberForm
          availableUsers={availableUsers}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          role={role}
          setRole={setRole}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}