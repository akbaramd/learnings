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
  ValidateNationalCodeRequest,
  ValidateNationalCodeResponse,
  UserProfile,
} from './auth.types';
import {
  setChallengeId,
  setMaskedPhoneNumber,
  setNationalCode,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  setErrorWithType,
  setInitialized,
} from './auth.slice';
import type { AuthErrorType } from './auth.types';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';

// Error handling utility - categorize errors
export const categorizeAuthError = (error: unknown): { message: string; type: AuthErrorType } => {
  let message = 'An unexpected error occurred';
  let type: AuthErrorType = 'unknown';

  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    
    // Check if it's an ApplicationResult with error data
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      
      // Get error message
      if (Array.isArray(data.errors) && data.errors[0]) {
        message = String(data.errors[0]);
      } else if (data.message) {
        message = String(data.message);
      }
      
      // Categorize error based on message content
      const messageLower = message.toLowerCase();
      if (messageLower.includes('یافت نشد') || messageLower.includes('not found') || messageLower.includes('کاربری با کد ملی')) {
        type = 'user_not_found';
      } else if (messageLower.includes('invalid') || messageLower.includes('نامعتبر') || messageLower.includes('credentials')) {
        type = 'invalid_credentials';
      } else if (messageLower.includes('otp') || messageLower.includes('کد')) {
        type = 'otp_failed';
      } else if (messageLower.includes('network') || messageLower.includes('timeout') || messageLower.includes('fetch')) {
        type = 'network_error';
      } else if (messageLower.includes('server') || messageLower.includes('500') || messageLower.includes('503')) {
        type = 'server_error';
      }
    } else if (apiError.message) {
      message = String(apiError.message);
      // Check network errors
      if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
        type = 'network_error';
      }
    }
  }

  return { message, type };
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

          // Check isSuccess flag - must be true for success
          if (data?.isSuccess === true && data?.data?.challengeId) {
            dispatch(setChallengeId(data.data.challengeId));
            if (data.data.maskedPhoneNumber) {
              dispatch(setMaskedPhoneNumber(data.data.maskedPhoneNumber));
            }
            // Store national code for resending OTP
            dispatch(setNationalCode(arg.nationalCode));
            dispatch(setAuthStatus('otp-sent'));
          } else {
            // Handle failure response - check if it's user not found
            const errorMessage = data?.message || data?.errors?.[0] || 'No challengeId returned from server.';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
            dispatch(setAuthStatus('error'));
          }
        } catch (error: unknown) {
          // Handle network/exception errors
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
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

          // Check isSuccess flag - must be true for success
          if (data?.isSuccess === true && data?.data?.userId) {
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('authenticated'));
            // Fetch user profile after successful verification
            dispatch(authApi.endpoints.getMe.initiate());
          } else {
            const errorMessage = data?.message || data?.errors?.[0] || 'OTP verification failed.';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
            dispatch(setAuthStatus('error'));
          }
        } catch (error: unknown) {
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
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

          // Check isSuccess flag
          if (data?.isSuccess === true && data?.data) {
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
          } else {
            // Handle failure response
            const errorMessage = data?.message || data?.errors?.[0] || 'Failed to fetch user profile.';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
            dispatch(setInitialized(true));
          }
        } catch (error: unknown) {
          // baseApi.ts handles 401 automatically → setAnonymous
          // Server-side refresh token handling in generatedClient.ts means:
          // - If we get here with 401, refresh definitively failed
          // - User must re-authenticate
          // - Clear user data and mark as initialized
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

          // Check isSuccess flag
          if (data?.isSuccess === true && data?.data?.isSuccess) {
            dispatch(clearUser());
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('anonymous'));
          } else {
            // Even if logout fails on server, clear local state for security
            dispatch(clearUser());
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('anonymous'));
            const errorMessage = data?.message || data?.errors?.[0] || 'Logout failed';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
          }
        } catch (error: unknown) {
          // Even if logout fails on server, clear local state
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
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

          // Check isSuccess flag
          if (data?.isSuccess === true && data?.data?.isSuccess) {
            dispatch(setAuthStatus('authenticated'));
          } else {
            dispatch(setAuthStatus('anonymous'));
            dispatch(clearUser());
            const errorMessage = data?.message || data?.errors?.[0] || 'Token refresh failed.';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
          }
        } catch (error: unknown) {
          dispatch(setAuthStatus('anonymous'));
          dispatch(clearUser());
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ 
            message: message || 'Session expired. Please login again.', 
            type: type === 'unknown' ? 'invalid_credentials' : type 
          }));
        }
      },
    }),

    // Validate national code query
    validateNationalCode: builder.query<ValidateNationalCodeResponse, ValidateNationalCodeRequest>({
      query: ({ nationalCode }) => ({
        url: '/auth/validate-national-code',
        method: 'POST',
        body: { nationalCode },
      }),
      providesTags: ['Auth'],
      keepUnusedDataFor: 60, // Keep validation result for 1 minute
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
  useValidateNationalCodeQuery,
  // Lazy query hooks
  useLazyGetMeQuery,
  useLazyValidateNationalCodeQuery,
} = authApi;

// Export the API slice
export default authApi;
