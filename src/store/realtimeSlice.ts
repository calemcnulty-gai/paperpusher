import { createSlice } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { AppDispatch } from "@/store"
import { QueryClient } from "@tanstack/react-query"

const queryClient = new QueryClient()

export const setupRealtimeSubscriptions = () => {
  return async (dispatch: AppDispatch) => {
    console.log("RealtimeSlice - Setting up realtime subscriptions...")

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('RealtimeSlice - Products change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['products'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('RealtimeSlice - Profiles change received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new
          })
          queryClient.invalidateQueries({ queryKey: ['profiles'] })
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