import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"

export interface TeamMember {
  team_id: string
  user_id: string
  role: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface TeamsState {
  teams: Team[]
  teamMembers: Record<string, TeamMember[]>
  loading: boolean
  error: string | null
}

const initialState: TeamsState = {
  teams: [],
  teamMembers: {},
  loading: false,
  error: null,
}

export const createTeam = createAsyncThunk(
  "teams/createTeam",
  async ({ name, description }: { name: string; description: string }) => {
    const { data, error } = await supabase
      .from("teams")
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const fetchTeams = createAsyncThunk(
  "teams/fetchTeams",
  async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }
)

export const deleteTeam = createAsyncThunk(
  "teams/deleteTeam",
  async (teamId: string) => {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)

    if (error) throw error
    return teamId
  }
)

export const fetchTeamMembers = createAsyncThunk(
  "teams/fetchTeamMembers",
  async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        team_id,
        user_id,
        role,
        created_at
      `)
      .eq("team_id", teamId)

    if (error) throw error
    return { teamId, members: data }
  }
)

export const addTeamMember = createAsyncThunk(
  "teams/addTeamMember",
  async ({ teamId, userId, role }: { teamId: string; userId: string; role: string }) => {
    console.log("Adding team member in slice:", { teamId, userId, role })
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Error adding team member:", error)
      throw error
    }
    console.log("Team member added successfully:", data)
    return data
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
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false
        state.teams.unshift(action.payload)
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to create team"
      })
      // Fetch teams
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false
        state.teams = action.payload
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch teams"
      })
      // Delete team
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter((team) => team.id !== action.payload)
      })
      // Fetch team members
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers[action.payload.teamId] = action.payload.members
      })
      // Add team member
      .addCase(addTeamMember.fulfilled, (state, action) => {
        const teamId = action.payload.team_id
        if (!state.teamMembers[teamId]) {
          state.teamMembers[teamId] = []
        }
        // Check if member already exists
        const existingIndex = state.teamMembers[teamId].findIndex(
          member => member.user_id === action.payload.user_id
        )
        if (existingIndex >= 0) {
          // Update existing member
          state.teamMembers[teamId][existingIndex] = action.payload
        } else {
          // Add new member
          state.teamMembers[teamId].push(action.payload)
        }
      })
      // Remove team member
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