// src/services/apiBase.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api', // فقط BFF - کلاینت فقط به Next.js API Routes می‌زند
    credentials: 'include', // کوکی‌های httpOnly سشن شما
    prepareHeaders: (headers) => {
      // در BFF pattern، توکن‌ها در کوکی‌های httpOnly ذخیره می‌شوند
      
      
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});
