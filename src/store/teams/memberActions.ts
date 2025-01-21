import { createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { TeamMemberData } from "./types"

export const fetchTeamMembers = createAsyncThunk(
  "teams/fetchTeamMembers",
  async (teamId: string) => {
    console.log("Fetching team members for team:", teamId)
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        team_id,
        user_id,
        role,
        created_at,
        deleted_at
      `)
      .eq("team_id", teamId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error fetching team members:", error)
      throw error
    }
    console.log("Fetched team members:", data)
    return { teamId, members: data }
  }
)

export const addTeamMember = createAsyncThunk(
  "teams/addTeamMember",
  async ({ teamId, userId, role }: TeamMemberData) => {
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

export const updateTeamMember = createAsyncThunk(
  "teams/updateTeamMember",
  async ({ teamId, userId, role }: TeamMemberData) => {
    console.log("Updating team member:", { teamId, userId, role })
    const { data, error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      console.error("Error updating team member:", error)
      throw error
    }
    console.log("Team member updated successfully:", data)
    return data
  }
)

export const removeTeamMember = createAsyncThunk(
  "teams/removeTeamMember",
  async ({ teamId, userId }: Omit<TeamMemberData, "role">) => {
    console.log("Removing team member:", { teamId, userId })
    const { error } = await supabase
      .from("team_members")
      .update({ deleted_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error removing team member:", error)
      throw error
    }
    console.log("Team member removed successfully")
    return { teamId, userId }
  }
)