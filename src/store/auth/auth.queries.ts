// src/store/auth/auth.queries.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LogoutResponse,
  RefreshResponse,
  GetMeResponse,
  UserProfile,
} from './auth.types';
import {
  setChallengeId,
  setMaskedPhoneNumber,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  setInitialized,
} from './auth.slice';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) {
        return String(data.errors[0]);
      }
      if (data.message) {
        return String(data.message);
      }
    }
    if (apiError.message) {
      return String(apiError.message);
    }
  }
  return 'An unexpected error occurred';
};

// Auth API slice with reauth support
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus for auth
  refetchOnReconnect: false, // Don't auto-refetch on reconnect - let manual checks handle it
  endpoints: (builder) => ({
    // Send OTP mutation (login endpoint)
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          const { data } = await queryFulfilled;

          if (data?.isSuccess && data?.data?.challengeId) {
            dispatch(setChallengeId(data.data.challengeId));
            if (data.data.maskedPhoneNumber) {
              dispatch(setMaskedPhoneNumber(data.data.maskedPhoneNumber));
            }
            dispatch(setAuthStatus('otp-sent'));
          } else {
            dispatch(setError(data?.errors?.[0] || 'No challengeId returned from server.'));
            dispatch(setAuthStatus('error'));
          }
        } catch (error: unknown) {
          const errorMessage = handleApiError(error);
          dispatch(setError(errorMessage));
          dispatch(setAuthStatus('error'));
        }
      },
    }),

    // Verify OTP mutation
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (credentials) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          const { data } = await queryFulfilled;

          if (data?.isSuccess && data?.data?.userId) {
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('authenticated'));
            // Fetch user profile after successful verification
            dispatch(authApi.endpoints.getMe.initiate());
          } else {
            dispatch(setError(data?.errors?.[0] || 'OTP verification failed.'));
            dispatch(setAuthStatus('error'));
          }
        } catch (error: unknown) {
          const errorMessage = handleApiError(error);
          dispatch(setError(errorMessage));
          dispatch(setAuthStatus('error'));
        }
      },
    }),

    // Get user profile query
    getMe: builder.query<GetMeResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 600, // Keep user data for 10 minutes
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.data) {
            const userProfile: UserProfile = data.data;
            const user = {
              id: userProfile.id,
              userName: userProfile.name || userProfile.firstName || 'Unknown',
              roles: userProfile.roles || [],
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              nationalId: userProfile.nationalId,
              phone: userProfile.phone,
            };
            dispatch(setUser(user));
            dispatch(setAuthStatus('authenticated'));
            dispatch(setInitialized(true));
          }
        } catch (error: unknown) {
          // baseApi.ts handles 401 automatically → setAnonymous
          // Just clear user data on any error
          dispatch(clearUser());
          dispatch(setInitialized(true));
        }
      },
    }),

    // Logout mutation
    logout: builder.mutation<LogoutResponse, { refreshToken?: string }>({
      query: ({ refreshToken }) => ({
        url: '/auth/logout',
        method: 'POST',
        body: { refreshToken: refreshToken || null },
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          const { data } = await queryFulfilled;

          if (data?.isSuccess && data?.data?.isSuccess) {
            dispatch(clearUser());
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('anonymous'));
          } else {
            dispatch(setAuthStatus('authenticated'));
            dispatch(setError(data?.errors?.[0] || 'Logout failed'));
          }
        } catch (error: unknown) {
          // Even if logout fails on server, clear local state
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          
          const errorMessage = handleApiError(error);
          dispatch(setError(errorMessage));
        }
      },
    }),

    // Refresh token mutation
    refreshToken: builder.mutation<RefreshResponse, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.isSuccess && data?.data?.isSuccess) {
            dispatch(setAuthStatus('authenticated'));
          } else {
            dispatch(setAuthStatus('anonymous'));
            dispatch(clearUser());
          }
        } catch {
          dispatch(setAuthStatus('anonymous'));
          dispatch(clearUser());
          dispatch(setError('Session expired. Please login again.'));
        }
      },
    }),
  }),
});

// Export hooks for components
export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  // Lazy query hooks
  useLazyGetMeQuery,
} = authApi;

// Export the API slice
export default authApi;
