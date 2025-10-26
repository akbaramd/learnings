// src/store/auth/auth.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../types';
import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  SessionResponse,
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

// Auth API slice
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Auth', 'User'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus for auth
  refetchOnReconnect: true, // Refetch when reconnecting
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

          if (data?.result?.challengeId) {
            dispatch(setChallengeId(data.result.challengeId));
            if (data.result.maskedPhoneNumber) {
              dispatch(setMaskedPhoneNumber(data.result.maskedPhoneNumber));
            }
            dispatch(setAuthStatus('otp-sent'));
          } else {
            dispatch(setError('No challengeId returned from server.'));
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

          if (data?.result?.isSuccess && data.result.userId) {
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('authenticated'));
            // Fetch user profile after successful verification
            dispatch(authApi.endpoints.getMe.initiate());
          } else {
            dispatch(setError('OTP verification failed.'));
            dispatch(setAuthStatus('error'));
          }
        } catch (error: unknown) {
          const errorMessage = handleApiError(error);
          dispatch(setError(errorMessage));
          dispatch(setAuthStatus('error'));
        }
      },
    }),

    // Check session query
    checkSession: builder.query<SessionResponse, void>({
      query: () => ({
        url: '/auth/session',
        method: 'GET',
      }),
      providesTags: ['Auth'],
      keepUnusedDataFor: 300, // Keep session data for 5 minutes
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const currentState = getState() as RootState;
          const currentStatus = currentState.auth.status;
          
          // Only set loading if we're not in OTP flow or already loading
          if (currentStatus !== 'otp-sent' && currentStatus !== 'loading') {
            dispatch(setAuthStatus('loading'));
          }

          const { data } = await queryFulfilled;

          if (data?.result?.authenticated) {
            if (currentStatus !== 'otp-sent') {
              dispatch(setAuthStatus('authenticated'));
              // Don't automatically fetch user profile - let components decide when to fetch
              // dispatch(authApi.endpoints.getMe.initiate());
            }
          } else {
            if (currentStatus !== 'otp-sent' && currentStatus !== 'loading') {
              dispatch(setAuthStatus('anonymous'));
              dispatch(clearUser());
            }
          }
        } catch {
          const currentState = getState() as RootState;
          const currentStatus = currentState.auth.status;
          if (currentStatus !== 'otp-sent' && currentStatus !== 'loading') {
            dispatch(setAuthStatus('anonymous'));
            dispatch(clearUser());
          }
        } finally {
          dispatch(setInitialized(true));
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
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            const userProfile: UserProfile = data.result;
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
          }
        } catch (error: unknown) {
          const currentState = getState() as RootState;
          const currentStatus = currentState.auth.status;
          
          // If getting user profile fails with 401, user is not authenticated
          if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
            dispatch(clearUser());
            dispatch(setAuthStatus('anonymous'));
          } else if (currentStatus !== 'otp-sent') {
            dispatch(clearUser());
            dispatch(setAuthStatus('anonymous'));
          }
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

          if (data?.result?.isSuccess) {
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

          if (data?.result?.isSuccess && data.result.accessToken) {
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
  useCheckSessionQuery,
  useGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  // Lazy query hooks
  useLazyCheckSessionQuery,
  useLazyGetMeQuery,
} = authApi;

// Export the API slice
export default authApi;
