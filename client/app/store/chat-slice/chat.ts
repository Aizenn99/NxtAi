import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatState {
  currentChatId: string | null;
  chats: Chat[];
  isLoading: boolean;
}

const generateId = () => {
  // Simple ID without uuid dependency
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const initialState: ChatState = {
  currentChatId: null,
  chats: [],
  isLoading: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    startNewChat(state) {
      const id = generateId();
      const newChat: Chat = { id, title: "New Chat", messages: [] };
      state.chats.push(newChat);
      state.currentChatId = id;
    },

    addMessage(state, action: PayloadAction<{ chatId: string; message: Omit<Message, "id"> }>) {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;

      const newMsg: Message = { ...message, id: generateId() };
      chat.messages.push(newMsg);

      // Auto-title the chat from the first user message
      if (chat.messages.length === 1 && message.role === "user") {
        chat.title =
          message.content.length > 40
            ? message.content.slice(0, 40) + "…"
            : message.content;
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    switchChat(state, action: PayloadAction<string>) {
      state.currentChatId = action.payload;
    },

    clearCurrentChat(state) {
      state.currentChatId = null;
    },
  },
});

export const {
  startNewChat,
  addMessage,
  setLoading,
  switchChat,
  clearCurrentChat,
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectCurrentChat = (state: { chat: ChatState }) =>
  state.chat.chats.find((c) => c.id === state.chat.currentChatId) ?? null;

export const selectMessages = (state: { chat: ChatState }) =>
  selectCurrentChat(state)?.messages ?? [];

export const selectIsLoading = (state: { chat: ChatState }) =>
  state.chat.isLoading;

export const selectChats = (state: { chat: ChatState }) => state.chat.chats;

export const selectCurrentChatId = (state: { chat: ChatState }) =>
  state.chat.currentChatId;

// Async thunk — orchestrates the full send flow
export const sendChatMessage = createAsyncThunk(
  "chat/sendChatMessage",
  async (userText: string, { dispatch, getState }) => {
    const state = getState() as { chat: ChatState };
    let chatId = state.chat.currentChatId;

    // Create a new chat if none is active
    if (!chatId) {
      dispatch(startNewChat());
      const updated = getState() as { chat: ChatState };
      chatId = updated.chat.currentChatId!;
    }

    // Add user message
    dispatch(
      addMessage({
        chatId,
        message: { role: "user", content: userText, timestamp: Date.now() },
      })
    );
    dispatch(setLoading(true));

    try {
      // Build history from updated state
      const latestState = getState() as { chat: ChatState };
      const history =
        latestState.chat.chats
          .find((c) => c.id === chatId)
          ?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API error");

      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: `⚠️ ${msg}`,
            timestamp: Date.now(),
          },
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  }
);
