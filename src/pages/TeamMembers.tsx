import { useState } from "react"
import { useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import { RootState } from "@/store"
import { supabase } from "@/integrations/supabase/client"
import { Profile } from "@/types/profiles"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/MainLayout"
import { AddTeamMemberDialog } from "@/components/teams/AddTeamMemberDialog"
import { TeamMembersList } from "@/components/teams/TeamMembersList"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function TeamMembers() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const teamMembers = useSelector((state: RootState) => 
    teamId ? state.teams.teamMembers[teamId] || [] : []
  )

  // Query for available users (not already in the team)
  const { data: availableUsers } = useQuery<Profile[]>({
    queryKey: ['available-users', teamId],
    queryFn: async () => {
      if (!teamId) return []
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .not('id', 'in', `(
          SELECT user_id 
          FROM team_members 
          WHERE team_id = '${teamId}'
        )`)
        .order('full_name')
      
      if (error) throw error
      return profiles
    },
    enabled: !!teamId
  })

  // Query for all profiles (needed for displaying team member details)
  const { data: allProfiles } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
      
      if (error) throw error
      return data
    }
  })

  // Create a map of profiles for easy lookup
  const profilesMap = (allProfiles || []).reduce<Record<string, Profile>>(
    (acc, profile) => {
      acc[profile.id] = profile
      return acc
    },
    {}
  )

  if (!teamId) return null

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/teams')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <h1 className="text-2xl font-bold">Team Members</h1>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)}>Add Member</Button>
        </div>

        <TeamMembersList 
          teamMembers={teamMembers} 
          profiles={profilesMap} 
        />

        <AddTeamMemberDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          availableUsers={availableUsers || []}
        />
      </div>
    </MainLayout>
  )
}