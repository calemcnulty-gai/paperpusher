import { createAsyncThunk } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { TeamCreateData, TeamMemberData } from "./types"

export const createTeam = createAsyncThunk(
  "teams/createTeam",
  async ({ name, description }: TeamCreateData) => {
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