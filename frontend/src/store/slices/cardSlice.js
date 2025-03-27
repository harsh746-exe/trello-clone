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
export const fetchCards = createAsyncThunk(
  'cards/fetchCards',
  async (listId, { rejectWithValue }) => {
    try {
      console.log('Fetching cards for list:', listId);
      const response = await axiosInstance.get(`/cards/list/${listId}`);
      console.log('Cards response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching cards:', error);
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

export const createCard = createAsyncThunk(
  'cards/createCard',
  async (cardData, { rejectWithValue }) => {
    try {
      console.log('Creating card with data:', cardData);
      const response = await axiosInstance.post('/cards/', cardData);
      console.log('Create card response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error);
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

export const updateCard = createAsyncThunk(
  'cards/updateCard',
  async ({ cardId, cardData }, { rejectWithValue }) => {
    try {
      console.log('Updating card:', cardId, cardData);
      const response = await axiosInstance.put(`/cards/${cardId}/`, {
        title: cardData.title,
        description: cardData.description,
        deadline: cardData.deadline,
        priority: cardData.priority
      });
      console.log('Update card response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating card:', error);
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

export const deleteCard = createAsyncThunk(
  'cards/deleteCard',
  async (cardId, { rejectWithValue }) => {
    try {
      console.log('Deleting card:', cardId);
      const response = await axiosInstance.delete(`/cards/${cardId}`);
      console.log('Delete card response:', response.data);
      return cardId;
    } catch (error) {
      console.error('Error deleting card:', error);
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

export const reorderCards = createAsyncThunk(
  'cards/reorderCards',
  async ({ sourceListId, destinationListId, sourceCards, destinationCards }, { rejectWithValue }) => {
    try {
      console.log('Reordering cards:', { sourceListId, destinationListId, sourceCards, destinationCards });
      const response = await axiosInstance.post('/cards/reorder/', {
        source_list_id: sourceListId,
        destination_list_id: destinationListId,
        cards: destinationCards.map(card => card._id)
      });
      console.log('Reorder cards response:', response.data);
      return { sourceListId, destinationListId, sourceCards, destinationCards };
    } catch (error) {
      console.error('Error reordering cards:', error);
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

const cardSlice = createSlice({
  name: 'cards',
  initialState: {
    cards: [],
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
      // Fetch Cards
      .addCase(fetchCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCards.fulfilled, (state, action) => {
        state.loading = false;
        // Merge new cards with existing ones, avoiding duplicates
        const newCards = action.payload;
        const existingCards = state.cards.filter(
          card => !newCards.some(newCard => newCard._id === card._id)
        );
        state.cards = [...existingCards, ...newCards];
      })
      .addCase(fetchCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch cards';
      })
      // Create Card
      .addCase(createCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCard.fulfilled, (state, action) => {
        state.loading = false;
        state.cards.push(action.payload);
      })
      .addCase(createCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create card';
      })
      // Update Card
      .addCase(updateCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCard.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.cards.findIndex(
          (card) => card._id === action.payload._id
        );
        if (index !== -1) {
          state.cards[index] = action.payload;
        }
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update card';
      })
      // Delete Card
      .addCase(deleteCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCard.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = state.cards.filter(
          (card) => card._id !== action.payload
        );
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete card';
      })
      // Reorder Cards
      .addCase(reorderCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderCards.fulfilled, (state, action) => {
        state.loading = false;
        const { sourceListId, destinationListId, sourceCards, destinationCards } = action.payload;
        // Update cards in both source and destination lists
        state.cards = state.cards.map(card => {
          if (card.list_id === destinationListId) {
            const newIndex = destinationCards.findIndex(c => c._id === card._id);
            if (newIndex !== -1) {
              return { ...card, position: newIndex * 1000 };
            }
          }
          return card;
        });
      })
      .addCase(reorderCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reorder cards';
      });
  },
});

export const { clearError } = cardSlice.actions;
export default cardSlice.reducer; 