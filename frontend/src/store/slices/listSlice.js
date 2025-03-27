import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance with auth token
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Async thunks
export const fetchLists = createAsyncThunk(
  'lists/fetchLists',
  async (boardId, { rejectWithValue }) => {
    try {
      console.log('Fetching lists for board:', boardId);
      const response = await axiosInstance.get(`/lists/board/${boardId}`);
      console.log('Lists response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching lists:', error);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

export const createList = createAsyncThunk(
  'lists/createList',
  async (listData, { rejectWithValue }) => {
    try {
      console.log('Creating list:', listData);
      const response = await axiosInstance.post('/lists/', listData);
      console.log('Create list response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating list:', error);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

export const updateList = createAsyncThunk(
  'lists/updateList',
  async ({ listId, title }, { rejectWithValue }) => {
    try {
      console.log('Updating list:', listId, title);
      const response = await axiosInstance.put(`/lists/${listId}/`, { title });
      console.log('Update list response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating list:', error);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

export const deleteList = createAsyncThunk(
  'lists/deleteList',
  async (listId, { rejectWithValue }) => {
    try {
      console.log('Deleting list:', listId);
      const response = await axiosInstance.delete(`/lists/${listId}`);
      console.log('Delete list response:', response.data);
      return listId;
    } catch (error) {
      console.error('Error deleting list:', error);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

export const reorderLists = createAsyncThunk(
  'lists/reorderLists',
  async ({ boardId, listIds }, { rejectWithValue }) => {
    try {
      console.log('Reordering lists:', { boardId, listIds });
      const response = await axiosInstance.put('/lists/reorder/', { board_id: boardId, list_ids: listIds });
      console.log('Reorder lists response:', response.data);
      return { boardId, listIds };
    } catch (error) {
      console.error('Error reordering lists:', error);
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

const listSlice = createSlice({
  name: 'list',
  initialState: {
    lists: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch lists
      .addCase(fetchLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLists.fulfilled, (state, action) => {
        state.loading = false;
        state.lists = action.payload;
      })
      .addCase(fetchLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch lists';
      })
      // Create list
      .addCase(createList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.loading = false;
        state.lists.push(action.payload);
      })
      .addCase(createList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create list';
      })
      // Update list
      .addCase(updateList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateList.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.lists.findIndex(
          (list) => list._id === action.payload._id
        );
        if (index !== -1) {
          state.lists[index] = action.payload;
        }
      })
      .addCase(updateList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update list';
      })
      // Delete list
      .addCase(deleteList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        state.loading = false;
        state.lists = state.lists.filter(
          (list) => list._id !== action.payload
        );
      })
      .addCase(deleteList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete list';
      })
      // Reorder lists
      .addCase(reorderLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderLists.fulfilled, (state, action) => {
        state.loading = false;
        state.lists = action.payload;
      })
      .addCase(reorderLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reorder lists';
      });
  },
});

export const { clearError } = listSlice.actions;
export default listSlice.reducer; 