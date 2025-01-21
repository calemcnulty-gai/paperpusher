import { createSlice } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { AppDispatch } from "@/store"
import { addTeamMember, removeTeamMember } from "./teamsSlice"
import { QueryClient } from "@tanstack/react-query"

// Create a singleton QueryClient instance
const queryClient = new QueryClient()

interface TeamMemberPayload {
  team_id: string
  user_id: string
  role: string
}

export const setupRealtimeSubscriptions = () => {
  return async (dispatch: AppDispatch) => {
    console.log("Setting up realtime subscriptions...")

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('Team members change received:', payload)
          if (payload.eventType === 'INSERT') {
            const newMember = payload.new as TeamMemberPayload
            dispatch(addTeamMember({
              teamId: newMember.team_id,
              userId: newMember.user_id,
              role: newMember.role
            }))
          } else if (payload.eventType === 'DELETE') {
            const oldMember = payload.old as TeamMemberPayload
            dispatch(removeTeamMember({
              teamId: oldMember.team_id,
              userId: oldMember.user_id
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          console.log('Tickets change received, invalidating tickets query')
          queryClient.invalidateQueries({ queryKey: ['tickets'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages' },
        () => {
          console.log('Ticket messages change received, invalidating messages query')
          queryClient.invalidateQueries({ queryKey: ['ticket-messages'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          console.log('Teams change received, invalidating teams query')
          queryClient.invalidateQueries({ queryKey: ['teams'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          console.log('Projects change received, invalidating projects query')
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
      )

    channel.subscribe((status) => {
      console.log("Realtime subscription status:", status)
    })
  }
}

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState: {
    isSubscribed: false
  },
  reducers: {
    setSubscribed: (state, action) => {
      state.isSubscribed = action.payload
    }
  }
})

export const { setSubscribed } = realtimeSlice.actions
export default realtimeSlice.reducer