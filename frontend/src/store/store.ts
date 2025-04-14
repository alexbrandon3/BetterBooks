import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import businessReducer from './slices/businessSlice';
import accountsReducer from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    accounts: accountsReducer,
    transactions: transactionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 