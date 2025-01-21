import { Profile } from "@/types/profiles"

export interface TeamMember {
  team_id: string
  user_id: string
  role: string
  created_at: string
  deleted_at?: string | null
}

export interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TeamsState {
  teams: Team[]
  teamMembers: Record<string, TeamMember[]>
  loading: boolean
  error: string | null
}

export interface TeamCreateData {
  name: string
  description: string
}

export interface TeamMemberData {
  teamId: string
  userId: string
  role: string
}