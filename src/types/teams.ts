export type TeamMemberRole = 'leader' | 'member';

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
    role: string;
  };
}

export interface AddTeamMemberData {
  teamId: string;
  userId: string;
  role: TeamMemberRole;
}