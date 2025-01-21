import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { TeamMember, AddTeamMemberData } from "@/types/teams"

interface TeamsState {
  teamMembers: Record<string, TeamMember[]>;
  loading: boolean;
  error: string | null;
}

const initialState: TeamsState = {
  teamMembers: {},
  loading: false,
  error: null,
}

export const fetchTeamMembers = createAsyncThunk(
  "teams/fetchTeamMembers",
  async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
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
      .eq("team_id", teamId)

    if (error) throw error

    return data.map(member => ({
      ...member,
      user: member.profiles,
      created_at: member.created_at || new Date().toISOString()
    })) as TeamMember[]
  }
)

export const addTeamMember = createAsyncThunk(
  "teams/addTeamMember",
  async ({ teamId, userId, role }: AddTeamMemberData) => {
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
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
  "teams/removeTeamMember",
  async ({ teamId, userId }: { teamId: string; userId: string }) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .match({ team_id: teamId, user_id: userId })

    if (error) throw error
    return { teamId, userId }
  }
)

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false
        state.teamMembers[action.meta.arg] = action.payload
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch team members"
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        const teamId = action.payload.team_id
        if (!state.teamMembers[teamId]) {
          state.teamMembers[teamId] = []
        }
        state.teamMembers[teamId].push(action.payload)
      })
      .addCase(removeTeamMember.fulfilled, (state, action) => {
        const { teamId, userId } = action.payload
        if (state.teamMembers[teamId]) {
          state.teamMembers[teamId] = state.teamMembers[teamId].filter(
            (member) => member.user_id !== userId
          )
        }
      })
  },
})

export default teamsSlice.reducer