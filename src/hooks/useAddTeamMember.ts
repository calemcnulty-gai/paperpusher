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
      
      // Check if member exists but is soft deleted
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', selectedUserId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing member:", checkError)
        throw checkError
      }

      let data
      if (existingMember?.deleted_at) {
        // Reactivate soft-deleted member
        const { data: reactivated, error: updateError } = await supabase
          .from('team_members')
          .update({ 
            role,
            deleted_at: null 
          })
          .eq('team_id', teamId)
          .eq('user_id', selectedUserId)
          .select()
          .single()

        if (updateError) throw updateError
        data = reactivated
      } else {
        // Add new member
        const { data: newMember, error: insertError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: selectedUserId,
            role,
          })
          .select()
          .single()

        if (insertError) {
          console.error("Error adding team member:", insertError)
          
          if (insertError.code === "23505") {
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
        data = newMember
      }

      console.log("Team member added to Supabase:", data)

      // Update Redux store
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