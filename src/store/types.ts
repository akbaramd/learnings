// src/store/types.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/src/services/apiBase';
import { authReducer, authApi } from './auth';
import { notificationsReducer, notificationsApi } from './notifications';
import { walletsReducer, walletsApi } from './wallets';
import { facilitiesApi, facilitiesReducer } from './facilities';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [walletsApi.reducerPath]: walletsApi.reducer,
    auth: authReducer,
    notifications: notificationsReducer,
    wallets: walletsReducer,
    facilities: facilitiesReducer,
  },
  middleware: (getDefault) => 
    getDefault()
      .concat(api.middleware)
      .concat(authApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(walletsApi.middleware)
      .concat(facilitiesApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
