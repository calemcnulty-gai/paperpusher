import { useState } from "react"
import { useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import { RootState } from "@/store"
import { supabase } from "@/integrations/supabase/client"
import { Profile } from "@/types/profiles"
import { Button } from "@/components/ui/button"
import { AddTeamMemberDialog } from "@/components/teams/AddTeamMemberDialog"
import { TeamMembersList } from "@/components/teams/TeamMembersList"

export default function TeamMembers() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { teamMembers } = useSelector((state: RootState) => state.teams)

  // Query for available users (not already in the team)
  const { data: availableUsers } = useQuery<Profile[]>({
    queryKey: ['available-users', teamMembers],
    queryFn: async () => {
      // If there are no team members, we don't need to filter
      if (teamMembers.length === 0) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .order('full_name')
        
        if (error) throw error
        return profiles
      }

      // If there are team members, filter them out
      const memberIds = teamMembers.map(m => m.user_id)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .not('id', 'in', `(${memberIds.join(',')})`)
        .order('full_name')

      if (error) throw error
      return profiles
    }
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Button onClick={() => setDialogOpen(true)}>Add Member</Button>
      </div>

      <TeamMembersList 
        teamMembers={teamMembers} 
        profiles={profilesMap} 
      />

      <AddTeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableUsers={availableUsers || []}
      />
    </div>
  )
}