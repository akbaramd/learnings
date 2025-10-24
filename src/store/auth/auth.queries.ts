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
  clearError,
  setInitialized,
} from './auth.slice';

// Error handling utility
const handleApiError = (error: unknown): string => {
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
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.result?.challengeId) {
            dispatch(setChallengeId(data.result.challengeId));
            if (data.result.maskedPhoneNumber) {
              dispatch(setMaskedPhoneNumber(data.result.maskedPhoneNumber));
            }
            dispatch(setAuthStatus('otp-sent'));
          } else {
            const errorMessage = 'No challengeId returned from server.';
            dispatch(setError(errorMessage));
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
          dispatch(clearError());

          const { data } = await queryFulfilled;

          if (data?.result?.isSuccess && data.result.userId) {
            // Clear challenge ID after successful verification
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('authenticated'));
            
            // Fetch user profile after successful verification
            dispatch(authApi.endpoints.getMe.initiate());
          } else {
            const errorMessage = 'OTP verification failed.';
            dispatch(setError(errorMessage));
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
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          // Don't override OTP flow state or loading states
          const currentState = getState() as RootState;
          const currentStatus = currentState.auth.status;
          
          // Only set loading if we're not in OTP flow or already loading
          if (currentStatus !== 'otp-sent' && currentStatus !== 'loading') {
            dispatch(setAuthStatus('loading'));
          }

          const { data } = await queryFulfilled;

          if (data?.result?.authenticated) {
            // Only update to authenticated if we're not in OTP flow
            if (currentStatus !== 'otp-sent') {
              dispatch(setAuthStatus('authenticated'));
              // Fetch user profile if authenticated
              dispatch(authApi.endpoints.getMe.initiate());
            }
          } else {
            // Don't override OTP flow state
            if (currentStatus !== 'otp-sent' && currentStatus !== 'loading') {
              dispatch(setAuthStatus('anonymous'));
              dispatch(clearUser());
            }
          }
        } catch {
          // Don't override OTP flow state
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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            const userProfile: UserProfile = data.result;
            // Transform UserProfile to User format
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
        } catch {
          // If getting user profile fails, user might not be authenticated
          dispatch(clearUser());
          dispatch(setAuthStatus('anonymous'));
        }
      },
    }),

    // Logout mutation
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          dispatch(setAuthStatus('loading'));
          dispatch(clearError());

          await queryFulfilled;

          // Clear all auth state on successful logout
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
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
            // Update user with new access token
            dispatch(setAuthStatus('authenticated'));
            // Optionally update the token in user state
            // This would require extending the User type to include accessToken
          } else {
            dispatch(setAuthStatus('anonymous'));
            dispatch(clearUser());
          }
        } catch {
          // If refresh fails, user needs to re-authenticate
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
} = authApi;

// Export the API slice
export default authApi;
