import { createSlice } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { AppDispatch } from "@/store"
import { addTeamMember, removeTeamMember, updateTeamMember } from "./teamsSlice"
import { QueryClient } from "@tanstack/react-query"

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
            console.log('Adding new team member:', newMember)
            dispatch(addTeamMember({
              teamId: newMember.team_id,
              userId: newMember.user_id,
              role: newMember.role
            }))
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ 
              queryKey: ['team-members', newMember.team_id] 
            })
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedMember = payload.new as TeamMemberPayload
            console.log('Updating team member:', updatedMember)
            dispatch(updateTeamMember({
              teamId: updatedMember.team_id,
              userId: updatedMember.user_id,
              role: updatedMember.role
            }))
            queryClient.invalidateQueries({ 
              queryKey: ['team-members', updatedMember.team_id] 
            })
          }
          else if (payload.eventType === 'DELETE') {
            const oldMember = payload.old as TeamMemberPayload
            console.log('Deleting team member:', oldMember)
            dispatch(removeTeamMember({
              teamId: oldMember.team_id,
              userId: oldMember.user_id
            }))
            queryClient.invalidateQueries({ 
              queryKey: ['team-members', oldMember.team_id] 
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('Teams change received, invalidating teams query')
          queryClient.invalidateQueries({ queryKey: ['teams'] })
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
