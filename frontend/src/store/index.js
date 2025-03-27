import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import listReducer from './slices/listSlice';
import cardReducer from './slices/cardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    list: listReducer,
    cards: cardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for non-serializable values
    }),
}); 