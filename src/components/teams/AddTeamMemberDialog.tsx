import { useState } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { addTeamMember } from "@/store/teamsSlice"
import { TeamMember, TeamMemberRole } from "@/types/teams"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface AddTeamMemberDialogProps {
  teamId: string;
}

export function AddTeamMemberDialog({ teamId }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>("member")
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()

  const { data: availableUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .not("id", "in", (select "user_id" from "team_members" where team_id = ${teamId}))

      if (error) throw error
      return data
    },
  })

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a user",
      })
      return
    }

    try {
      await dispatch(
        addTeamMember({
          teamId,
          userId: selectedUserId,
          role: selectedRole,
        })
      ).unwrap()

      toast({
        title: "Success",
        description: "Team member added successfully",
      })
      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add team member",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select 
              value={selectedRole} 
              onValueChange={(value: string) => setSelectedRole(value as TeamMemberRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leader">Team Leader</SelectItem>
                <SelectItem value="member">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddMember} className="w-full">
            Add Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}