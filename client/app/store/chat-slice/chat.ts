import {
  createSlice,
  createAsyncThunk,
  createSelector,
  PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import { updateCredits, logoutUser } from "../auth-slice/auth";

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
  pinned?: boolean;
  shareId?: string | null;
  messages: Message[];
}

interface ChatState {
  currentChatId: string | null;
  chats: Chat[];
  isLoading: boolean;
  selectedModel: string;
}

const generateId = () => {
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
  selectedModel: "llama-3.3-70b-versatile",
};

// ─────────────────────────────────────────────────────────────
// Strip base64 images before saving to localStorage or MongoDB
// ─────────────────────────────────────────────────────────────
const stripBase64FromChats = (chats: Chat[]): Chat[] => {
  return chats.map((chat) => ({
    ...chat,
    messages: chat.messages.map((msg) => ({
      ...msg,
      content: msg.content
        // Strip image base64
        .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, "[image]")
        // ✅ Strip PDF base64 from chat history
        .replace(/^\[pdf-ready\|\|\|[A-Za-z0-9+/=]+\|\|\|(.+)\]$/s, "[pdf:$1]"),
    })),
  }));
};

// Instant localStorage backup helper
const backupToLocalStorage = (chats: Chat[]) => {
  if (typeof window === "undefined") return;
  try {
    const clean = stripBase64FromChats(chats);
    localStorage.setItem("chats_backup", JSON.stringify(clean));
  } catch (e) {
    console.warn("localStorage backup failed:", e);
  }
};

// ─────────────────────────────────────────────────────────────
// All thunks ABOVE createSlice — no ReferenceError
// ─────────────────────────────────────────────────────────────

export const fetchChatHistory = createAsyncThunk(
  "chat/fetchHistory",
  async (_, { dispatch }) => {
    try {
      const res = await axios.get(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        if (typeof window !== "undefined") {
          const localBackup = localStorage.getItem("chats_backup");
          if (localBackup) {
            const localChats: Chat[] = JSON.parse(localBackup);
            const mongoIds = new Set(res.data.map((c: Chat) => c.id));
            const missingChats = localChats.filter((c) => !mongoIds.has(c.id));

            if (missingChats.length > 0) {
              const merged = [...res.data, ...missingChats];
              dispatch(setChats(merged));
              await axios.post(
                `${API_URL}/api/chathistory`,
                { chats: stripBase64FromChats(merged) },
                { withCredentials: true },
              );
              return;
            }
          }
        }
        dispatch(setChats(res.data));
      } else {
        if (typeof window !== "undefined") {
          const localBackup = localStorage.getItem("chats_backup");
          if (localBackup) {
            const localChats: Chat[] = JSON.parse(localBackup);
            if (localChats.length > 0) {
              dispatch(setChats(localChats));
              await axios.post(
                `${API_URL}/api/chathistory`,
                { chats: localChats },
                { withCredentials: true },
              );
            }
          }
        }
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      if (typeof window !== "undefined") {
        try {
          const localBackup = localStorage.getItem("chats_backup");
          if (localBackup) {
            const localChats: Chat[] = JSON.parse(localBackup);
            dispatch(setChats(localChats));
          }
        } catch (localErr) {
          console.error("localStorage fallback failed:", localErr);
        }
      }
    }
  },
);

export const syncChatHistory = createAsyncThunk(
  "chat/syncHistory",
  async (_, { getState }) => {
    const state = getState() as { chat: ChatState };
    try {
      const cleanChats = stripBase64FromChats(state.chat.chats);
      await axios.post(
        `${API_URL}/api/chathistory`,
        { chats: cleanChats },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Sync history error:", err);
    }
  },
);

export const deleteChatById = createAsyncThunk(
  "chat/delete",
  async (chatId: string) => {
    await axios.delete(`${API_URL}/api/chathistory/${chatId}`, {
      withCredentials: true,
    });
    return { chatId };
  },
);

export const renameChat = createAsyncThunk(
  "chat/rename",
  async ({ chatId, title }: { chatId: string; title: string }) => {
    await axios.put(
      `${API_URL}/api/chathistory/${chatId}/rename`,
      { title },
      { withCredentials: true },
    );
  },
);

export const pinChat = createAsyncThunk("chat/pin", async (chatId: string) => {
  await axios.put(
    `${API_URL}/api/chathistory/${chatId}/pin`,
    {},
    { withCredentials: true },
  );
  return chatId;
});

export const shareChat = createAsyncThunk(
  "chat/share",
  async (chatId: string) => {
    const res = await axios.post(
      `${API_URL}/api/chathistory/${chatId}/share`,
      {},
      { withCredentials: true },
    );
    return { chatId, shareId: res.data.shareId };
  },
);

// ✅ Generates AI title from first user message
export const generateChatTitle = createAsyncThunk(
  "chat/generateTitle",
  async (
    { chatId, message }: { chatId: string; message: string },
    { dispatch },
  ) => {
    try {
      const res = await fetch("/api/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      const title = data.title || message.slice(0, 40);

      // ✅ Update title in state
      dispatch(setChatTitle({ chatId, title }));

      // ✅ Sync updated title to MongoDB
      dispatch(syncChatHistory());
    } catch (err) {
      console.error("Title generation failed:", err);
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "chat/send",
  async (userText: string, { dispatch, getState }) => {
    const state = getState() as { chat: ChatState };

    let chatId = state.chat.currentChatId;

    if (!chatId) {
      dispatch(startNewChat());
      const updated = getState() as { chat: ChatState };
      chatId = updated.chat.currentChatId!;
    }

    // Capture history BEFORE dispatching user message
    const existingHistory =
      (getState() as { chat: ChatState }).chat.chats
        .find((c) => c.id === chatId)
        ?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [];

    const fullHistory = [
      ...existingHistory,
      { role: "user" as const, content: userText },
    ];

    dispatch(
      addMessage({
        chatId,
        message: {
          role: "user",
          content: userText,
          timestamp: Date.now(),
        },
      }),
    );

    // ✅ Generate AI title on first message only
    const chatAfterMessage = (
      getState() as { chat: ChatState }
    ).chat.chats.find((c) => c.id === chatId);

    if (chatAfterMessage?.messages.length === 1) {
      dispatch(generateChatTitle({ chatId, message: userText }));
    }

    dispatch(setLoading(true));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: fullHistory,
          model: state.chat.selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "API error");

      if (data.remainingCredits !== undefined) {
        dispatch(updateCredits(data.remainingCredits));
      }

      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
          },
        }),
      );
    } catch (err: any) {
      dispatch(
        addMessage({
          chatId,
          message: {
            role: "assistant",
            content: `⚠️ ${err.message}`,
            timestamp: Date.now(),
          },
        }),
      );
    } finally {
      dispatch(setLoading(false));
      dispatch(syncChatHistory());
    }
  },
);

// ─────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    startNewChat(state) {
      const id = generateId();
      const newChat: Chat = {
        id,
        title: "New Chat",
        pinned: false,
        messages: [],
      };
      state.chats.push(newChat);
      state.currentChatId = id;

      if (typeof window !== "undefined") {
        localStorage.setItem("currentChatId", id);
        backupToLocalStorage(state.chats);
      }
    },

    // ✅ Used by generateChatTitle thunk to update title in state
    setChatTitle(
      state,
      action: PayloadAction<{ chatId: string; title: string }>,
    ) {
      const { chatId, title } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.title = title;
        backupToLocalStorage(state.chats);
      }
    },

    addMessage(
      state,
      action: PayloadAction<{ chatId: string; message: Omit<Message, "id"> }>,
    ) {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) return;

      const newMsg: Message = { ...message, id: generateId() };
      chat.messages.push(newMsg);

      // ✅ No title logic here — handled by generateChatTitle thunk
      // Backup to localStorage on every message instantly
      backupToLocalStorage(state.chats);
    },

    setChats(state, action: PayloadAction<Chat[]>) {
      state.chats = action.payload;
      if (state.currentChatId) {
        const exists = state.chats.some((c) => c.id === state.currentChatId);
        if (!exists) {
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

  extraReducers: (builder) => {
    // Logout — clear everything including backup
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.chats = [];
      state.currentChatId = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentChatId");
        localStorage.removeItem("chats_backup");
      }
    });

    // Delete chat
    builder.addCase(deleteChatById.fulfilled, (state, action) => {
      state.chats = state.chats.filter(
        (chat) => chat.id !== action.payload.chatId,
      );
      if (state.currentChatId === action.payload.chatId) {
        state.currentChatId = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("currentChatId");
        }
      }
      backupToLocalStorage(state.chats);
    });

    // Rename chat
    builder.addCase(renameChat.fulfilled, (state, action) => {
      const { chatId, title } = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.title = title;
        backupToLocalStorage(state.chats);
      }
    });

    // Pin chat — optimistic toggle with rollback on failure
    builder.addCase(pinChat.fulfilled, (state, action) => {
      const chatId = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.pinned = !chat.pinned;
        backupToLocalStorage(state.chats);
      }
    });
    builder.addCase(pinChat.rejected, (state, action) => {
      const chatId = action.meta.arg;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.pinned = !chat.pinned;
    });

    // Share chat — store shareId
    builder.addCase(shareChat.fulfilled, (state, action) => {
      const { chatId, shareId } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) chat.shareId = shareId;
    });
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
  setChatTitle,
} = chatSlice.actions;

export default chatSlice.reducer;

// ─────────────────────────────────────────────────────────────
// Memoized selectors — stops unnecessary rerenders
// ─────────────────────────────────────────────────────────────

export const selectCurrentChat = createSelector(
  (state: { chat: ChatState }) => state.chat.chats,
  (state: { chat: ChatState }) => state.chat.currentChatId,
  (chats, currentChatId) => chats.find((c) => c.id === currentChatId) ?? null,
);

export const selectMessages = createSelector(
  (state: { chat: ChatState }) => state.chat.chats,
  (state: { chat: ChatState }) => state.chat.currentChatId,
  (chats, currentChatId) =>
    chats.find((c) => c.id === currentChatId)?.messages ?? [],
);

export const selectIsLoading = (state: { chat: ChatState }) =>
  state.chat.isLoading;

export const selectChats = createSelector(
  (state: { chat: ChatState }) => state.chat.chats,
  (chats) => [...chats].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
);

export const selectCurrentChatId = (state: { chat: ChatState }) =>
  state.chat.currentChatId;

export const selectSelectedModel = (state: { chat: ChatState }) =>
  state.chat.selectedModel;
