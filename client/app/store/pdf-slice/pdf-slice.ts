import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface PDFState {
  loading: boolean;
  error: string | null;
  lastGenerated: string | null;
}

const initialState: PDFState = {
  loading: false,
  error: null,
  lastGenerated: null,
};

export const generatePDF = createAsyncThunk(
  "pdf/generate",
  async (topic: string, thunkAPI) => {
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        const err = await res.json();
        return thunkAPI.rejectWithValue(err.error || "PDF generation failed");
      }

      // Download PDF directly
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      return topic;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

const pdfSlice = createSlice({
  name: "pdf",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generatePDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePDF.fulfilled, (state, action) => {
        state.loading = false;
        state.lastGenerated = action.payload;
      })
      .addCase(generatePDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = pdfSlice.actions;
export default pdfSlice.reducer;
