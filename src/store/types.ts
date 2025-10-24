// src/store/types.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/src/services/apiBase';
import { authReducer, authApi } from './auth';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefault) => 
    getDefault()
      .concat(api.middleware)
      .concat(authApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
