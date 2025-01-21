import { createSlice } from "@reduxjs/toolkit"
import { TeamsState } from "./types"
import { 
  createTeam,
  fetchTeams,
  deleteTeam
} from "./teamActions"
import {
  fetchTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember
} from "./memberActions"

const initialState: TeamsState = {
  teams: [],
  teamMembers: {},
  loading: false,
  error: null,
}

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Team operations
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
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.teams = state.teams.filter((team) => team.id !== action.payload)
      })
      
      // Team member operations
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.teamMembers[action.payload.teamId] = action.payload.members
      })
      .addCase(addTeamMember.fulfilled, (state, action) => {
        const teamId = action.payload.team_id
        if (!state.teamMembers[teamId]) {
          state.teamMembers[teamId] = []
        }
        const existingIndex = state.teamMembers[teamId].findIndex(
          member => member.user_id === action.payload.user_id
        )
        if (existingIndex >= 0) {
          state.teamMembers[teamId][existingIndex] = action.payload
        } else {
          state.teamMembers[teamId].push(action.payload)
        }
      })
      .addCase(updateTeamMember.fulfilled, (state, action) => {
        const teamId = action.payload.team_id
        const memberIndex = state.teamMembers[teamId]?.findIndex(
          member => member.user_id === action.payload.user_id
        )
        if (memberIndex !== undefined && memberIndex !== -1) {
          state.teamMembers[teamId][memberIndex] = action.payload
        }
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

export * from "./types"
export * from "./teamActions"
export * from "./memberActions"
export default teamsSlice.reducer