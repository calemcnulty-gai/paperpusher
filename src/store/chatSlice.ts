import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isLoading: false,
  error: null,
};

export const sendMessage = createAsyncThunk<
  { content: string },
  Message[],
  { rejectValue: { message: string } }
>(
  'chat/sendMessage',
  async (messages, { rejectWithValue }) => {
    try {
      console.log('Sending chat message:', messages);
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue({ message: (error as Error).message });
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearChat: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.messages.push({
            role: 'assistant',
            content: action.payload.content,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to send message';
      });
  },
});

export const { toggleChat, addMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;