import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authReducer from "./authSlice"
import realtimeReducer from "./realtimeSlice"
import profilesReducer from "./profilesSlice"
import productFiltersReducer from "./productFiltersSlice"
import chatReducer from "./chatSlice"
import agentReducer from "./agentSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    realtime: realtimeReducer,
    profiles: profilesReducer,
    productFilters: productFiltersReducer,
    chat: chatReducer,
    agent: agentReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector