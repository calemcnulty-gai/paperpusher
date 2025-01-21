import { TeamMember } from "@/store/teamsSlice"
import { Profile } from "@/types/profiles"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch } from "react-redux"
import { removeTeamMember } from "@/store/teamsSlice"
import { useParams } from "react-router-dom"
import { AppDispatch } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface TeamMembersListProps {
  teamMembers: TeamMember[]
  profiles: Record<string, Profile>
}

export function TeamMembersList({ teamMembers, profiles }: TeamMembersListProps) {
  const { teamId } = useParams()
  const { toast } = useToast()
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()

  const handleRemoveMember = async (userId: string) => {
    if (!teamId) return

    try {
      console.log("Removing team member:", { teamId, userId })
      
      // First, delete from Supabase
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

      if (error) {
        console.error("Supabase error removing team member:", error)
        throw error
      }

      // Then update Redux store
      await dispatch(removeTeamMember({ teamId, userId })).unwrap()
      
      // Invalidate the team members query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] })
      
      toast({
        title: "Team member removed",
        description: "The user has been removed from the team.",
      })
    } catch (error) {
      console.error("Error removing team member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Team Members</h2>
      <div className="rounded-md border">
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 font-medium">
            <div>Name</div>
            <div>Role</div>
            <div className="text-right">Actions</div>
          </div>
        </div>
        <div className="divide-y">
          {teamMembers.map((member) => {
            const profile = profiles[member.user_id]
            if (!profile) return null

            return (
              <div key={member.user_id} className="grid grid-cols-3 gap-4 p-4">
                <div className="flex flex-col">
                  <span>{profile.full_name || "Unnamed"}</span>
                  <span className="text-sm text-muted-foreground">
                    {profile.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="capitalize">{member.role}</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}