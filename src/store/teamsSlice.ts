import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"

export type TeamMemberRole = "leader" | "member"

export interface TeamMember {
  team_id: string
  user_id: string
  role: TeamMemberRole
  created_at: string
  user?: {
    full_name: string
    email: string
    role: string
  }
}

interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface TeamsState {
  teams: Team[]
  selectedTeam: Team | null
  teamMembers: TeamMember[]
  loading: boolean
  error: string | null
}

const initialState: TeamsState = {
  teams: [],
  selectedTeam: null,
  teamMembers: [],
  loading: false,
  error: null,
}

export const fetchTeams = createAsyncThunk(
  'teams/fetchTeams',
  async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data as Team[]
  }
)

export const fetchTeamMembers = createAsyncThunk(
  'teams/fetchTeamMembers',
  async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        user_id,
        role,
        created_at,
        profiles:user_id (
          full_name,
          email,
          role
        )
      `)
      .eq('team_id', teamId)
    
    if (error) throw error
    return data.map(member => ({
      ...member,
      user: member.profiles,
      created_at: member.created_at || new Date().toISOString()
    })) as TeamMember[]
  }
)

export const createTeam = createAsyncThunk(
  'teams/createTeam',
  async (team: Pick<Team, 'name' | 'description'>) => {
    const { data, error } = await supabase
      .from('teams')
      .insert([team])
      .select()
      .single()
    
    if (error) throw error
    return data as Team
  }
)

export const updateTeam = createAsyncThunk(
  'teams/updateTeam',
  async ({ id, ...updates }: Partial<Team> & { id: string }) => {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Team
  }
)

export const deleteTeam = createAsyncThunk(
  'teams/deleteTeam',
  async (id: string) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return id
  }
)

export const addTeamMember = createAsyncThunk(
  'teams/addTeamMember',
  async (member: Omit<TeamMember, "user">) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert([member])
      .select(`
        team_id,
        user_id,
        role,
        created_at,
        profiles:user_id (
          full_name,
          email,
          role
        )
      `)
      .single()
    
    if (error) throw error
    return {
      ...data,
      user: data.profiles,
      created_at: data.created_at || new Date().toISOString()
    } as TeamMember
  }
)

export const removeTeamMember = createAsyncThunk(
  'teams/removeTeamMember',
  async ({ teamId, userId }: { teamId: string, userId: string }) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)
    
    if (error) throw error
    return { teamId, userId }
  }
)

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setSelectedTeam: (state, action) => {
      state.selectedTeam = action.payload
    },
    clearSelectedTeam: (state) => {
      state.selectedTeam = null
      state.teamMembers = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teams = action.payload
        state.loading = false
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch teams'
      })
      // Fetch team members
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers = action.payload
      })
      // Create team
      .addCase(createTeam.fulfilled, (state, action) => {
        state.teams.push(action.payload)
      })
      // Update team
      .addCase(updateTeam.fulfilled, (state, action) => {
        const index = state.teams.findIndex(team => team.id === action.payload.id)
        if (index !== -1) {
          state.teams[index] = action.payload
        }
        if (state.selectedTeam?.id === action.payload.id) {
          state.selectedTeam = action.payload
        }
      })
      // Delete team
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter(team => team.id !== action.payload)
        if (state.selectedTeam?.id === action.payload) {
          state.selectedTeam = null
          state.teamMembers = []
        }
      })
      // Add team member
      .addCase(addTeamMember.fulfilled, (state, action) => {
        state.teamMembers.push(action.payload)
      })
      // Remove team member
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        state.teamMembers = state.teamMembers.filter(
          member => !(member.team_id === action.payload.teamId && member.user_id === action.payload.userId)
        )
      })
  },
})

export const { setSelectedTeam, clearSelectedTeam } = teamsSlice.actions
export default teamsSlice.reducer