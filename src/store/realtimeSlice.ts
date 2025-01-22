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
    console.log("RealtimeSlice - Setting up realtime subscriptions...")

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('RealtimeSlice - Team members change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          
          if (payload.eventType === 'INSERT') {
            const newMember = payload.new as TeamMemberPayload
            console.log('RealtimeSlice - Adding new team member:', newMember)
            dispatch(addTeamMember({
              teamId: newMember.team_id,
              userId: newMember.user_id,
              role: newMember.role
            }))
            queryClient.invalidateQueries({ 
              queryKey: ['team-members', newMember.team_id] 
            })
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedMember = payload.new as TeamMemberPayload
            console.log('RealtimeSlice - Updating team member:', updatedMember)
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
            console.log('RealtimeSlice - Deleting team member:', oldMember)
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
          console.log('RealtimeSlice - Teams change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['teams'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          console.log('RealtimeSlice - Tickets change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['tickets'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_messages' },
        (payload) => {
          console.log('RealtimeSlice - Ticket messages change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['ticket-messages'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('RealtimeSlice - Projects change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        }
      )

    channel.subscribe((status) => {
      console.log("RealtimeSlice - Realtime subscription status:", status)
      if (status === 'SUBSCRIBED') {
        console.log("RealtimeSlice - Successfully subscribed to all channels")
      } else if (status === 'CLOSED') {
        console.log("RealtimeSlice - Channel closed")
      } else if (status === 'CHANNEL_ERROR') {
        console.error("RealtimeSlice - Channel error occurred")
      }
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