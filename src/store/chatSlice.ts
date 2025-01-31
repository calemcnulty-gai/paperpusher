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
  void,
  Message[],
  { rejectValue: { message: string } }
>(
  'chat/sendMessage',
  async (messages, { dispatch, rejectWithValue }) => {
    try {
      console.log('Sending chat message. Raw messages:', messages);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No auth session found');
      }

      const response = await fetch('https://gukvkyekmmdlmliomxtj.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data || !data.content) {
        throw new Error('Invalid response from server');
      }

      dispatch(updateAssistantMessage({
        content: data.content,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Chat error:', error);
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
    updateAssistantMessage: (state, action: PayloadAction<{ content: string, timestamp: string }>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = action.payload.content;
        lastMessage.timestamp = action.payload.timestamp;
      } else {
        state.messages.push({
          role: 'assistant',
          content: action.payload.content,
          timestamp: action.payload.timestamp
        });
      }
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
      .addCase(sendMessage.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to send message';
      });
  },
});

export const { toggleChat, addMessage, updateAssistantMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;