// src/services/users.api.ts (Client)
import { api } from './apiBase';

type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  phone?: string;
  roles?: string[];
  claims?: any[];
  preferences?: any[];
};

type MeResult = {
  result: User | null;
  errors: any | null;
};

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<MeResult, void>({
      query: () => ({ 
        url: '/users/me', 
        method: 'GET' 
      }), // ← hits /api/users/me
      providesTags: ['Users'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery } = usersApi;
