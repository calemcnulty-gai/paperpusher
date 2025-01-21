import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./authSlice"
import teamsReducer from "./teams/teamsSlice"
import realtimeReducer from "./realtimeSlice"
import profilesReducer from "./profilesSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    teams: teamsReducer,
    realtime: realtimeReducer,
    profiles: profilesReducer,
  },
})
