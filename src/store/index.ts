import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import profilesReducer from './profilesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profiles: profilesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;