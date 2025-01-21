import { useState } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { addTeamMember } from "@/store/teamsSlice"
import { Profile } from "@/types/profiles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export interface AddTeamMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  availableUsers: Profile[]
  teamId: string
}

export function AddTeamMemberDialog({ isOpen, onClose, availableUsers, teamId }: AddTeamMemberDialogProps) {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [role, setRole] = useState<string>("member")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId || !selectedUserId) return

    try {
      console.log("Adding team member:", { teamId, userId: selectedUserId, role })
      
      // First, add to Supabase
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: selectedUserId,
          role,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase error adding team member:", error)
        
        // Handle the specific duplicate member error
        if (error?.code === "23505") {
          toast({
            variant: "destructive",
            title: "Error",
            description: "This user is already a member of the team.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add team member. Please try again.",
          })
        }
        return
      }

      console.log("Team member added to Supabase:", data)

      // Then update Redux store
      await dispatch(addTeamMember({
        teamId,
        userId: selectedUserId,
        role,
      })).unwrap()

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] })
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      })
      
      onClose()
      setSelectedUserId("")
      setRole("member")
    } catch (error: any) {
      console.error("Failed to add team member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add team member. Please try again.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="user" className="text-sm font-medium text-gray-700">
              User
            </label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
            >
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
            <label htmlFor="role" className="text-sm font-medium text-gray-700">
              Role
            </label>
            <Select
              value={role}
              onValueChange={(value: string) => setRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId}
            >
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}