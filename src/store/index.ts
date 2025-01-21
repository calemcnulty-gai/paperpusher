import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./authSlice"
import teamsReducer from "./teamsSlice"
import profilesReducer from "./profilesSlice"
import realtimeReducer from "./realtimeSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teams: teamsReducer,
    profiles: profilesReducer,
    realtime: realtimeReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch