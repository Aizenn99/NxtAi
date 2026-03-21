import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Generate Image
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Generate Image
export const generateImage = createAsyncThunk(
  "image/generate",
  async ({ prompt, width, height }, thunkAPI) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/generate/image`, // ✅ full URL
        { prompt, width, height },
        { withCredentials: true }, // ✅ match your auth method
      );
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Image generation failed",
      );
    }
  },
);

// Fetch User Images
export const fetchUserImages = createAsyncThunk(
  "image/fetchAll",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/images`, // ✅ full URL
        { withCredentials: true },
      );
      return res.data.images;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch images",
      );
    }
  },
);

// Delete Image
export const deleteImage = createAsyncThunk(
  "image/delete",
  async (imageId, thunkAPI) => {
    try {
      await axios.delete(
        `${API_URL}/api/images/${imageId}`, // ✅ full URL
        { withCredentials: true },
      );
      return imageId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete image",
      );
    }
  },
);

const imageSlice = createSlice({
  name: "image",
  initialState: {
    images: [],
    currentImage: null,
    loading: false,
    deleteLoading: null,
    error: null,
    creditsRemaining: null,
  },
  reducers: {
    clearCurrentImage: (state) => {
      state.currentImage = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate
    builder
      .addCase(generateImage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentImage = null;
      })
      .addCase(generateImage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentImage = action.payload.image;
        state.creditsRemaining = action.payload.creditsRemaining;
        state.images.unshift(action.payload.image);
      })
      .addCase(generateImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch All
    builder
      .addCase(fetchUserImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserImages.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(fetchUserImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete
    builder
      .addCase(deleteImage.pending, (state, action) => {
        state.deleteLoading = action.meta.arg;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.deleteLoading = null;
        state.images = state.images.filter((img) => img._id !== action.payload);
        if (state.currentImage?._id === action.payload) {
          state.currentImage = null;
        }
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.deleteLoading = null;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentImage, clearError } = imageSlice.actions;
export default imageSlice.reducer;
