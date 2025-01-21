import { useState } from "react"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { addTeamMember } from "@/store/teamsSlice"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

export function useAddTeamMember(teamId: string, onClose: () => void) {
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

  return {
    selectedUserId,
    setSelectedUserId,
    role,
    setRole,
    handleSubmit,
  }
}