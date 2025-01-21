import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Profile } from "@/types/profiles"
import { AddTeamMemberDialog } from "@/components/teams/AddTeamMemberDialog"
import { TeamMembersList } from "@/components/teams/TeamMembersList"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus, ArrowLeft } from "lucide-react"
import { MainLayout } from "@/components/layout/MainLayout"
import { useTeamMembers } from "@/hooks/useTeamMembers"

const TeamMembers = () => {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  const { data: teamMembers = [], isLoading: loadingTeamMembers } = useTeamMembers(teamId)

  const { data: profiles = {}, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      console.log("Fetching all profiles")
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
      
      if (error) {
        console.error("Error fetching profiles:", error)
        throw error
      }

      console.log("Fetched profiles:", profiles)
      const profileMap: Record<string, Profile> = {}
      profiles.forEach((profile: Profile) => {
        profileMap[profile.id] = profile
      })
      
      return profileMap
    }
  })

  const { data: availableUsers = [], isLoading: loadingAvailableUsers } = useQuery({
    queryKey: ["available-users", teamId, teamMembers],
    queryFn: async () => {
      if (!teamId) return []
      
      const memberIds = teamMembers.map(m => m.user_id)
      console.log("Current team member IDs:", memberIds)

      // Base query without filter
      const query = supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      // Only apply the filter if there are existing members
      if (memberIds.length > 0) {
        const memberIdsStr = memberIds.join(',')
        console.log("Filtering out members with IDs:", memberIdsStr)
        await query.not('id', 'in', `(${memberIdsStr})`)
      }
      
      const { data: profiles, error } = await query
      
      if (error) {
        console.error("Error fetching available users:", error)
        throw error
      }

      console.log("Fetched available users:", profiles)
      return profiles as Profile[]
    },
    enabled: !!teamId && !loadingTeamMembers
  })

  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      if (!teamId) return null
      
      console.log("Fetching team details for:", teamId)
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      
      if (error) {
        console.error("Error fetching team details:", error)
        throw error
      }

      console.log("Fetched team details:", data)
      return data
    },
    enabled: !!teamId
  })

  if (!teamId) {
    return (
      <MainLayout>
        <div>Team ID is required</div>
      </MainLayout>
    )
  }

  const isLoading = loadingTeamMembers || loadingProfiles || loadingAvailableUsers

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <h1 className="text-2xl font-bold">{team?.name}</h1>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <TeamMembersList 
              teamMembers={teamMembers} 
              profiles={profiles}
            />
            
            <AddTeamMemberDialog 
              isOpen={isAddMemberOpen}
              onClose={() => setIsAddMemberOpen(false)}
              availableUsers={availableUsers}
              teamId={teamId}
            />
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default TeamMembers