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
export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching boards...');
      const response = await axiosInstance.get('/boards/');
      console.log('Boards response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching boards:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received');
        return rejectWithValue({ message: 'No response from server. Please check if the server is running.' });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        return rejectWithValue({ message: 'Failed to send request. Please try again.' });
      }
    }
  }
);

export const fetchBoard = createAsyncThunk(
  'boards/fetchBoard',
  async (boardId, { rejectWithValue }) => {
    try {
      console.log('Fetching board:', boardId);
      const response = await axiosInstance.get(`/boards/${boardId}`);
      console.log('Board response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching board:', error);
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

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (boardData, { rejectWithValue }) => {
    try {
      console.log('Creating board:', boardData);
      const response = await axiosInstance.post('/boards/', boardData);
      console.log('Create board response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating board:', error);
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

export const updateBoard = createAsyncThunk(
  'boards/updateBoard',
  async ({ boardId, boardData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/boards/${boardId}`, boardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteBoard = createAsyncThunk(
  'boards/deleteBoard',
  async (boardId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/boards/${boardId}`);
      return boardId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,
};

const boardSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    setCurrentBoard: (state, action) => {
      state.currentBoard = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Boards
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch boards';
      })
      // Fetch Single Board
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch board';
      })
      // Create Board
      .addCase(createBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards.push(action.payload);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create board';
      })
      // Update Board
      .addCase(updateBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.boards.findIndex(
          (board) => board._id === action.payload._id
        );
        if (index !== -1) {
          state.boards[index] = action.payload;
        }
        if (state.currentBoard?._id === action.payload._id) {
          state.currentBoard = action.payload;
        }
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update board';
      })
      // Delete Board
      .addCase(deleteBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = state.boards.filter(
          (board) => board._id !== action.payload
        );
        if (state.currentBoard?._id === action.payload) {
          state.currentBoard = null;
        }
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete board';
      });
  },
});

export const { setCurrentBoard, clearError } = boardSlice.actions;
export default boardSlice.reducer; 