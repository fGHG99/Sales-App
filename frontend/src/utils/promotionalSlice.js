import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPromotionals,
  createPromotional,
  updatePromotional,
  deletePromotional,
} from "../services/promotionalService";

// Async thunks
export const fetchPromotionals = createAsyncThunk(
  "promotional/fetchPromotionals",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPromotionals();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch promotionals"
      );
    }
  }
);

export const createPromotionalAsync = createAsyncThunk(
  "promotional/createPromotional",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await createPromotional(formData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create promotional"
      );
    }
  }
);

export const updatePromotionalAsync = createAsyncThunk(
  "promotional/updatePromotional",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await updatePromotional(id, formData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update promotional"
      );
    }
  }
);

export const deletePromotionalAsync = createAsyncThunk(
  "promotional/deletePromotional",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deletePromotional(id);
      return { id, response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete promotional"
      );
    }
  }
);

const promotionalSlice = createSlice({
  name: "promotional",
  initialState: {
    promotionals: [],
    loading: false,
    error: null,
    previewData: null, // For preview functionality
    isPreviewMode: false,
  },
  reducers: {
    setPreviewData: (state, action) => {
      state.previewData = action.payload;
      state.isPreviewMode = true;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
      state.isPreviewMode = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch promotionals
      .addCase(fetchPromotionals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionals.fulfilled, (state, action) => {
        state.loading = false;
        state.promotionals = action.payload.promotionals || [];
      })
      .addCase(fetchPromotionals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create promotional
      .addCase(createPromotionalAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPromotionalAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.promotionals.unshift(action.payload.promotional);
        state.isPreviewMode = false;
        state.previewData = null;
      })
      .addCase(createPromotionalAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update promotional
      .addCase(updatePromotionalAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePromotionalAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.promotionals.findIndex(
          (p) => p.id === action.payload.promotional.id
        );
        if (index !== -1) {
          state.promotionals[index] = action.payload.promotional;
        }
        state.isPreviewMode = false;
        state.previewData = null;
      })
      .addCase(updatePromotionalAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete promotional
      .addCase(deletePromotionalAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePromotionalAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.promotionals = state.promotionals.filter(
          (p) => p.id !== action.payload.id
        );
      })
      .addCase(deletePromotionalAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPreviewData, clearPreviewData, clearError } =
  promotionalSlice.actions;
export default promotionalSlice.reducer;
