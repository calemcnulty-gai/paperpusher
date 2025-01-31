import { createSlice } from "@reduxjs/toolkit"
import { supabase } from "@/integrations/supabase/client"
import { AppDispatch } from "@/store"
import { QueryClient } from "@tanstack/react-query"
import { fetchTasks } from "./tasksSlice"
import { fetchProducts } from "./productsSlice"
import { fetchProfiles } from "./profilesSlice"

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
          console.group('RealtimeSlice - Products Change')
          console.log('Event type:', payload.eventType)
          console.log('Old record:', payload.old)
          console.log('New record:', payload.new)
          console.log('Full payload:', payload)
          console.log('Dispatching fetchProducts action...')
          console.groupEnd()
          
          dispatch(fetchProducts())
            .then((result) => {
              console.group('RealtimeSlice - Products Fetch Result')
              console.log('Action type:', result.type)
              console.log('Action payload:', result.payload)
              console.groupEnd()
            })
            .catch(error => {
              console.error('RealtimeSlice - Error fetching products:', error)
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.group('RealtimeSlice - Profiles Change')
          console.log('Event type:', payload.eventType)
          console.log('Old record:', payload.old)
          console.log('New record:', payload.new)
          console.log('Full payload:', payload)
          console.log('Dispatching fetchProfiles action...')
          console.groupEnd()
          
          dispatch(fetchProfiles())
            .then((result) => {
              console.group('RealtimeSlice - Profiles Fetch Result')
              console.log('Action type:', result.type)
              console.log('Action payload:', result.payload)
              console.groupEnd()
            })
            .catch(error => {
              console.error('RealtimeSlice - Error fetching profiles:', error)
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.group('RealtimeSlice - Tasks Change')
          console.log('Event type:', payload.eventType)
          console.log('Old record:', payload.old)
          console.log('New record:', payload.new)
          console.log('Full payload:', payload)
          console.log('Dispatching fetchTasks action...')
          console.groupEnd()
          
          dispatch(fetchTasks())
            .then((result) => {
              console.group('RealtimeSlice - Tasks Fetch Result')
              console.log('Action type:', result.type)
              console.log('Action payload:', result.payload)
              console.groupEnd()
            })
            .catch(error => {
              console.error('RealtimeSlice - Error fetching tasks:', error)
            })
        }
      )

    channel.subscribe((status) => {
      console.group('RealtimeSlice - Subscription Status Change')
      console.log('Status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to all channels')
        dispatch(setSubscribed(true))
      } else if (status === 'CLOSED') {
        console.log('Channel closed')
        dispatch(setSubscribed(false))
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Channel error occurred')
        dispatch(setSubscribed(false))
      }
      console.groupEnd()
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