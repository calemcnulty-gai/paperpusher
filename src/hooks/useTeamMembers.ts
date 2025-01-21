import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { TeamMember } from "@/store/teamsSlice"
import { useEffect } from "react"

export const useTeamMembers = (teamId: string | undefined) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!teamId) return

    console.log("Setting up team members realtime subscription for team:", teamId)
    
    const channel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          console.log('Team members change received:', payload)
          queryClient.invalidateQueries({ queryKey: ["team-members", teamId] })
        }
      )
      .subscribe((status) => {
        console.log("Team members subscription status:", status)
      })

    return () => {
      console.log("Cleaning up team members subscription")
      supabase.removeChannel(channel)
    }
  }, [teamId, queryClient])

  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return []
      
      console.log("Fetching team members for team:", teamId)
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
      
      if (error) {
        console.error("Error fetching team members:", error)
        throw error
      }
      console.log("Fetched team members:", members)
      return members as TeamMember[]
    },
    enabled: !!teamId
  })
}