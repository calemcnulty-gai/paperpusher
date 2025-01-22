import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
