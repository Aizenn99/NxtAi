"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice/auth";
import chatReducer from "./chat-slice/chat";
import chatHistoryReducer from "./chathistory-slice/chathistory";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    chatHistory: chatHistoryReducer,
  },
});
