import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Using NEXT_PUBLIC_API_URL for Next.js app
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  selectedModel: string;
}

const generateId = () => {
  // Simple ID without uuid dependency
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getInitialChatId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("currentChatId");
  }
  return null;
};

const initialState: ChatState = {
  currentChatId: getInitialChatId(),
  chats: [],
  isLoading: false,
  selectedModel: "llama-3.3-70b-versatile", // Default to Groq's Llama
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
      if (typeof window !== "undefined") {
        localStorage.setItem("currentChatId", id);
      }
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

    setChats(state, action: PayloadAction<Chat[]>) {
      state.chats = action.payload;
      
      // Validate that the persisted currentChatId actually exists in the newly loaded chats
      if (state.currentChatId) {
        const chatExists = state.chats.some(c => c.id === state.currentChatId);
        if (!chatExists) {
          state.currentChatId = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("currentChatId");
          }
        }
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    switchChat(state, action: PayloadAction<string>) {
      state.currentChatId = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("currentChatId", action.payload);
      }
    },

    clearCurrentChat(state) {
      state.currentChatId = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentChatId");
      }
    },

    setSelectedModel(state, action: PayloadAction<string>) {
      state.selectedModel = action.payload;
    },
  },
});

export const {
  startNewChat,
  addMessage,
  setChats,
  setLoading,
  switchChat,
  clearCurrentChat,
  setSelectedModel,
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

export const selectSelectedModel = (state: { chat: ChatState }) =>
  state.chat.selectedModel;

// Database sync thunks
export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });
      // response.data holds the `.chats` array
      if (Array.isArray(response.data) && response.data.length > 0) {
        dispatch(setChats(response.data));
      }
    } catch (error) {
      console.error("Error fetching chat history from DB:", error);
    }
  }
);

export const syncChatHistory = createAsyncThunk(
  "chat/syncHistory",
  async (_, { getState }) => {
    try {
      const state = getState() as { chat: ChatState };
      await axios.post(
        `${API_URL}/api/chathistory`,
        { chats: state.chat.chats },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error saving chat history to DB:", error);
    }
  }
);

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
        body: JSON.stringify({ 
          messages: history,
          model: state.chat.selectedModel 
        }),
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
      // Once both messages have landed, push the full store updates to MongoDB
      dispatch(syncChatHistory());
    }
  }
);
