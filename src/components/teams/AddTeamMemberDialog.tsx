import { useState } from "react"
import { useParams } from "react-router-dom"
import { Profile } from "@/types/profiles"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch } from "react-redux"
import { addTeamMember, TeamMemberRole } from "@/store/teamsSlice"
import { AppDispatch } from "@/store"

interface AddTeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableUsers: Profile[]
}

export function AddTeamMemberDialog({ open, onOpenChange, availableUsers }: AddTeamMemberDialogProps) {
  const { teamId } = useParams()
  const { toast } = useToast()
  const dispatch = useDispatch<AppDispatch>()
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>("member")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddMember = async () => {
    if (!selectedUserId || !teamId) return

    setIsSubmitting(true)
    try {
      await dispatch(addTeamMember({
        team_id: teamId,
        user_id: selectedUserId,
        role: selectedRole,
        created_at: new Date().toISOString(),
      })).unwrap()

      toast({
        title: "Team member added",
        description: "The user has been added to the team successfully.",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding team member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add team member. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedUserId || isSubmitting}
            >
              Add Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}