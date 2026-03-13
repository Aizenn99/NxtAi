import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Using NEXT_PUBLIC_API_URL for Next.js app
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const saveChatHistory = createAsyncThunk(
  "chatHistory/save",
  async (messages) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/chathistory`,
        { messages },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error saving chat history:", error);
      throw error;
    }
  },
);

export const getChatHistory = createAsyncThunk(
  "chatHistory/get",
  async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chathistory`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  },
);

const chatHistorySlice = createSlice({
  name: "chatHistory",
  initialState: {
    history: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveChatHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(saveChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getChatHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default chatHistorySlice.reducer;
