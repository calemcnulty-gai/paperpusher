import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { Profile } from "@/types/profiles"
import { AddTeamMemberDialog } from "@/components/teams/AddTeamMemberDialog"
import { TeamMembersList } from "@/components/teams/TeamMembersList"
import { Button } from "@/components/ui/button"
import { Loader2, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TeamMember } from "@/store/teamsSlice"

const TeamMembers = () => {
  const { teamId } = useParams<{ teamId: string }>()
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const { toast } = useToast()

  const { data: teamMembers = [], isLoading: loadingTeamMembers } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return []
      
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
      
      if (error) throw error
      return members as TeamMember[]
    },
    enabled: !!teamId
  })

  const { data: profiles = {}, isLoading: loadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
      
      if (error) throw error
      
      const profileMap: Record<string, Profile> = {}
      profiles.forEach((profile: Profile) => {
        profileMap[profile.id] = profile
      })
      
      return profileMap
    }
  })

  const { data: availableUsers = [], isLoading: loadingAvailableUsers } = useQuery({
    queryKey: ["available-users", teamId],
    queryFn: async () => {
      if (!teamId) return []
      
      const memberIds = teamMembers.map(m => m.user_id)
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'in', memberIds.length > 0 ? memberIds : [null])
        .order('full_name')
      
      if (error) throw error
      return profiles as Profile[]
    },
    enabled: !!teamId && !loadingTeamMembers
  })

  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      if (!teamId) return null
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!teamId
  })

  if (!teamId) {
    return <div>Team ID is required</div>
  }

  const isLoading = loadingTeamMembers || loadingProfiles || loadingAvailableUsers

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{team?.name} - Team Members</h1>
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
          />
        </>
      )}
    </div>
  )
}

export default TeamMembers