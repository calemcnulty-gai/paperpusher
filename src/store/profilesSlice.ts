import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
};

interface ProfilesState {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
}

const initialState: ProfilesState = {
  profiles: [],
  loading: false,
  error: null,
};

export const fetchProfiles = createAsyncThunk(
  'profiles/fetchProfiles',
  async () => {
    console.log("Fetching profiles from Supabase")
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error("Error fetching profiles:", error)
      throw error;
    }
    console.log("Fetched profiles:", data)
    return data as Profile[];
  }
);

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload;
        console.log("Profiles updated in Redux store:", state.profiles)
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch profiles';
        console.error("Error in profiles slice:", state.error)
      });
  },
});

export default profilesSlice.reducer;