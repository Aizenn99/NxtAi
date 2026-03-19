"use client";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice/auth";
import chatReducer from "./chat-slice/chat";
import imageReducer from "./image-slices/image-slice";
import pdfReducer from "./pdf-slice/pdf-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    image: imageReducer,
    pdf: pdfReducer,
  },
});
