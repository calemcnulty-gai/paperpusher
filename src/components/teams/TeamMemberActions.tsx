import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch } from "react-redux"
import { removeTeamMember } from "@/store/teamsSlice"
import { AppDispatch } from "@/store"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

interface TeamMemberActionsProps {
  teamId: string
  userId: string
}

export function TeamMemberActions({ teamId, userId }: TeamMemberActionsProps) {
  const { toast } = useToast()
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()

  const handleRemoveMember = async () => {
    try {
      console.log("Soft deleting team member:", { teamId, userId })
      
      // Update Supabase with soft delete
      const { error } = await supabase
        .from('team_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .is('deleted_at', null)

      if (error) {
        console.error("Supabase error removing team member:", error)
        throw error
      }

      // Update Redux store
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
    <Button
      variant="destructive"
      size="sm"
      onClick={handleRemoveMember}
    >
      Remove
    </Button>
  )
}