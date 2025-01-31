import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  role: "client" | "supplier" | "principal";
  email: string;
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isInitializing: boolean;
}

const initialState: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  isInitializing: true,
};

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId: string) => {
    console.log("Fetching profile for user:", userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error)
      throw error;
    }

    if (!data) {
      console.log("No profile found, creating new profile...")
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        throw new Error('Cannot create profile: no email available');
      }

      const profileData = {
        id: userId,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || null,
        role: "client" as const
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError)
        throw createError;
      }
      console.log("New profile created:", newProfile)
      return newProfile as Profile;
    }

    console.log("Profile found:", data)
    return data as Profile;
  }
);

export const loadSession = createAsyncThunk(
  'auth/loadSession',
  async () => {
    console.log("Loading initial session...")
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error loading session:", error)
      throw error;
    }
    
    console.log("Session loaded:", session)
    return session;
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
    },
    clearAuth: (state) => {
      state.session = null;
      state.user = null;
      state.profile = null;
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        state.user = action.payload?.user ?? null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load session';
        state.isInitializing = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
        state.isInitializing = false;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to fetch profile';
        state.loading = false;
        state.isInitializing = false;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.session = null;
        state.user = null;
        state.profile = null;
        state.error = null;
      });
  },
});

export const { setSession, clearAuth, setInitialized } = authSlice.actions;
export default authSlice.reducer;