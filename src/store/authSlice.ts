import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
};

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.email) {
        throw new Error('Cannot create profile: no email available');
      }

      const profileData = {
        id: userId,
        email: currentUser.email,
        full_name: currentUser.user_metadata?.full_name || null,
        role: 'customer'
      };

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) throw createError;
      return newProfile as Profile;
    }

    return data as Profile;
  }
);

export const loadSession = createAsyncThunk(
  'auth/loadSession',
  async (_, { dispatch }) => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (session?.user) {
      dispatch(fetchProfile(session.user.id));
    }
    
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
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to fetch profile';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.session = null;
        state.user = null;
        state.profile = null;
        state.error = null;
      });
  },
});

export const { setSession, clearAuth } = authSlice.actions;
export default authSlice.reducer; 