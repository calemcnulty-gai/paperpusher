import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import type { 
  AgentState, 
  AgentAction, 
  CreateTaskPayload, 
  UpdateTaskPayload, 
  UpdateProductPayload 
} from './agentTypes';

const initialState: AgentState = {
  lastAction: null,
  isProcessing: false,
  error: null,
};

export const executeAgentAction = createAsyncThunk<
  AgentAction,
  { action: AgentAction },
  { rejectValue: { message: string } }
>(
  'agent/executeAction',
  async ({ action }, { rejectWithValue }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth session found');
      }

      // Execute the appropriate action based on type
      switch (action.type) {
        case 'CREATE_TASK': {
          const payload = action.payload as CreateTaskPayload;
          const { data, error } = await supabase
            .from('tasks')
            .insert([{
              ...payload,
              creator_id: action.metadata.userId,
              assignee_id: payload.assignee_id || action.metadata.userId,
            }])
            .select()
            .single();

          if (error) throw error;
          return {
            ...action,
            payload: data,
            metadata: {
              ...action.metadata,
              status: 'success'
            }
          };
        }

        case 'UPDATE_TASK': {
          const payload = action.payload as UpdateTaskPayload;
          const { data, error } = await supabase
            .from('tasks')
            .update({ 
              status: payload.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', payload.id)
            .select()
            .single();

          if (error) throw error;
          return {
            ...action,
            payload: data,
            metadata: {
              ...action.metadata,
              status: 'success'
            }
          };
        }

        case 'UPDATE_PRODUCT': {
          const payload = action.payload as UpdateProductPayload;
          const { data, error } = await supabase
            .from('products')
            .update(payload.updates)
            .eq('id', payload.id)
            .select()
            .single();

          if (error) throw error;
          return {
            ...action,
            payload: data,
            metadata: {
              ...action.metadata,
              status: 'success'
            }
          };
        }

        case 'NORMAL_RESPONSE':
          return action;

        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      console.error('Agent action error:', error);
      return rejectWithValue({ 
        message: (error as Error).message || 'Failed to execute agent action' 
      });
    }
  }
);

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearLastAction: (state) => {
      state.lastAction = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeAgentAction.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(executeAgentAction.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.lastAction = action.payload;
        state.error = null;
      })
      .addCase(executeAgentAction.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload?.message || 'Unknown error occurred';
      });
  },
});

export const { clearLastAction } = agentSlice.actions;
export default agentSlice.reducer; 