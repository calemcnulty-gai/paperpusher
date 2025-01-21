import { TeamMember } from "@/store/teamsSlice"
import { Profile } from "@/types/profiles"
import { TeamMemberActions } from "./TeamMemberActions"
import { useParams } from "react-router-dom"

interface TeamMembersListProps {
  teamMembers: TeamMember[]
  profiles: Record<string, Profile>
}

export function TeamMembersList({ teamMembers, profiles }: TeamMembersListProps) {
  const { teamId } = useParams()

  if (!teamId) return null

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
                  <TeamMemberActions 
                    teamId={teamId} 
                    userId={member.user_id}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}