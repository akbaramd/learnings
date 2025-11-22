// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/src/store/api/baseApi';
import { authReducer, authApi } from './auth';
import { notificationsReducer, notificationsApi } from './notifications';
import { walletsReducer, walletsApi } from './wallets';
import { billsReducer, billsApi } from './bills';
import { paymentsReducer, paymentsApi } from './payments';
import { discountsReducer, discountsApi } from './discounts';
import { toursApi , toursReducer} from './tours';
import { facilitiesApi, facilitiesReducer } from './facilities';
import { surveysApi, surveysReducer } from './surveys';
import { membersApi, membersReducer } from './members';
import { accommodationsApi, accommodationsReducer } from './accommodations';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [walletsApi.reducerPath]: walletsApi.reducer,
    [billsApi.reducerPath]: billsApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [discountsApi.reducerPath]: discountsApi.reducer,
    [toursApi.reducerPath]: toursApi.reducer,
    [facilitiesApi.reducerPath]: facilitiesApi.reducer,
    [surveysApi.reducerPath]: surveysApi.reducer,
    [membersApi.reducerPath]: membersApi.reducer,
    [accommodationsApi.reducerPath]: accommodationsApi.reducer,
    auth: authReducer,
    notifications: notificationsReducer,
    wallets: walletsReducer,
    bills: billsReducer,
    payments: paymentsReducer,
    discounts: discountsReducer,
    tours: toursReducer,
    facilities: facilitiesReducer,
    surveys: surveysReducer,
    members: membersReducer,
    accommodations: accommodationsReducer,
  },
  middleware: (getDefault) => 
    getDefault()
      .concat(api.middleware)
      .concat(authApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(walletsApi.middleware)
      .concat(billsApi.middleware)
      .concat(paymentsApi.middleware)
      .concat(discountsApi.middleware)
      .concat(toursApi.middleware)
      .concat(facilitiesApi.middleware)
      .concat(surveysApi.middleware)
      .concat(membersApi.middleware)
      .concat(accommodationsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
