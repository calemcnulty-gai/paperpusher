import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { RootState } from '@/store';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignee_id: string;
  creator_id: string;
  collaborator_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
}

interface TasksState {
  items: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue, getState }) => {
    try {
      console.group('TasksSlice - Fetching Tasks')
      console.log('Making Supabase request...')
      
      const state = getState() as RootState
      const userId = state.auth.user?.id
      
      if (!userId) {
        throw new Error('No user ID found')
      }

      console.log('Fetching tasks for user:', userId)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error)
        console.groupEnd()
        throw error;
      }
      
      console.log('Fetch successful. Tasks count:', data?.length)
      console.log('Tasks data:', data)
      console.groupEnd()
      return data;
    } catch (error) {
      console.error('TasksSlice - Error in fetchTasks:', error)
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchTaskById',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    upsertTask: (state, action) => {
      console.group('TasksSlice - upsertTask')
      console.log('Action payload:', action.payload)
      const index = state.items.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        console.log('Updating existing task at index:', index)
        state.items[index] = action.payload;
      } else {
        console.log('Adding new task')
        state.items.unshift(action.payload);
      }
      console.log('New state items count:', state.items.length)
      console.groupEnd()
    },
    removeTask: (state, action) => {
      console.group('TasksSlice - removeTask')
      console.log('Task ID to remove:', action.payload)
      const initialCount = state.items.length
      state.items = state.items.filter(task => task.id !== action.payload);
      console.log('Removed tasks count:', initialCount - state.items.length)
      console.groupEnd()
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        console.log('TasksSlice - fetchTasks.pending')
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        console.group('TasksSlice - fetchTasks.fulfilled')
        console.log('Previous tasks count:', state.items.length)
        console.log('New tasks count:', action.payload.length)
        state.isLoading = false;
        state.items = action.payload;
        console.groupEnd()
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        console.group('TasksSlice - fetchTasks.rejected')
        console.log('Error:', action.payload)
        state.isLoading = false;
        state.error = action.payload as string;
        console.groupEnd()
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        console.group('TasksSlice - fetchTaskById.fulfilled')
        console.log('Task data:', action.payload)
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          console.log('Updating existing task at index:', index)
          state.items[index] = action.payload;
        } else {
          console.log('Adding new task')
          state.items.unshift(action.payload);
        }
        console.log('New state items count:', state.items.length)
        console.groupEnd()
      });
  },
});

export const { upsertTask, removeTask } = tasksSlice.actions;
export default tasksSlice.reducer; 