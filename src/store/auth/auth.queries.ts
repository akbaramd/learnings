// src/store/auth/auth.queries.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import {
  LogoutRequest,
  LogoutByRefreshTokenRequest,
  LogoutAllSessionsRequest,
  LogoutAllOtherSessionsRequest,
  LogoutResponse,
  RefreshResponse,
  GetMeResponse,
  ValidateNationalCodeRequest,
  ValidateNationalCodeResponse,
  GetSessionsPaginatedRequest,
  GetSessionsPaginatedResponse,
  UserProfile,
} from './auth.types';
import {
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
import { getDeviceId, getUserAgent, fetchClientInfo, getCachedIpAddress } from '@/src/lib/deviceInfo';
import type { RefreshTokenRequest } from './auth.types';

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
    // Note: sendOtp mutation removed - now handled by NextAuth
    // OTP sending is done via NextAuth signIn('send-otp', { nationalCode })

    // Note: verifyOtp mutation removed - now handled by NextAuth
    // OTP verification is done via NextAuth signIn('otp', { challengeId, otp })

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
        } catch {
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

    // Logout mutation - handles all logout scenarios
    logout: builder.mutation<LogoutResponse, LogoutRequest | void>({
      query: (request) => {
        // Handle void case (no parameters)
        const req = request || {};
        
        return {
          url: '/auth/logout',
          method: 'POST',
          body: {
            refreshToken: req.refreshToken || null,
          },
        };
      },
      invalidatesTags: ['Auth', 'User'], // Invalidate both Auth and User tags
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        console.log('[Logout Mutation] Starting logout...', {
          hasRefreshToken: !!arg?.refreshToken,
        });

        try {
          // Set loading state
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          // Wait for API response
          const { data } = await queryFulfilled;
          console.log('[Logout Mutation] API response:', {
            isSuccess: data?.isSuccess,
            message: data?.message,
            hasData: !!data?.data,
            dataIsSuccess: data?.data?.isSuccess,
          });

          // Handle successful logout response
          if (data?.isSuccess === true) {
            // Check nested data.isSuccess if present
            const logoutSuccess = data?.data?.isSuccess !== false;
            
            if (logoutSuccess) {
              console.log('[Logout Mutation] ✅ Logout successful');
            } else {
              console.warn('[Logout Mutation] ⚠️ API returned success but data.isSuccess is false');
            }
          } else {
            console.warn('[Logout Mutation] ⚠️ API returned isSuccess: false', {
              message: data?.message,
              errors: data?.errors,
            });
          }

          // CRITICAL: Always clear local state regardless of API response
          // This ensures security - even if logout API fails (timeout, network error),
          // we clear local state to prevent unauthorized access
          console.log('[Logout Mutation] Clearing local state...');
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          console.log('[Logout Mutation] ✅ Local state cleared');

          // If API response indicates failure, log error but don't block logout
          if (data?.isSuccess === false) {
            const errorMessage = data?.message || data?.errors?.[0] || 'Logout request failed on server';
            const { message, type } = categorizeAuthError({ data });
            console.warn('[Logout Mutation] Server logout failed, but local state cleared:', {
              message: errorMessage || message,
              type,
            });
            // Don't set error state - logout is still successful from user perspective
            // Local state is cleared, which is what matters for security
          }
        } catch (error: unknown) {
          console.error('[Logout Mutation] ❌ Error during logout:', error);
          
          // CRITICAL: Always clear local state even on network/server errors
          // This ensures security - if logout API is unreachable (timeout, network error),
          // we still clear local state to prevent unauthorized access
          console.log('[Logout Mutation] Clearing local state due to error...');
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          console.log('[Logout Mutation] ✅ Local state cleared after error');

          // Categorize and log error
          const { message, type } = categorizeAuthError(error);
          console.warn('[Logout Mutation] Error details:', { message, type });
          
          // Don't set error state - logout is still successful from user perspective
          // Local state is cleared, which is what matters for security
          // The error is logged for debugging but doesn't block the logout flow
        }
        
        console.log('[Logout Mutation] Logout flow completed');
      },
    }),

    // Logout by refresh token mutation
    logoutByRefreshToken: builder.mutation<LogoutResponse, LogoutByRefreshTokenRequest>({
      query: (request) => ({
        url: '/auth/logout/refresh-token',
        method: 'POST',
        body: {
          refreshToken: request.refreshToken || null,
        },
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        console.log('[LogoutByRefreshToken] Starting logout by refresh token...', {
          hasRefreshToken: !!arg.refreshToken,
        });

        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          const { data } = await queryFulfilled;
          console.log('[LogoutByRefreshToken] API response:', {
            isSuccess: data?.isSuccess,
            message: data?.message,
          });

          // Always clear local state for security
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          console.log('[LogoutByRefreshToken] ✅ Local state cleared');
        } catch (error: unknown) {
          console.error('[LogoutByRefreshToken] ❌ Error:', error);
          // Always clear local state even on error
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
        }
      },
    }),

    // Logout by session ID mutation
    logoutBySessionId: builder.mutation<LogoutResponse, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: `/auth/logout/session/${sessionId}`,
        method: 'POST',
        body: {}, // Empty body - sessionId is in path
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        console.log('[LogoutBySessionId] Starting logout for session...', {
          sessionId: arg.sessionId,
        });

        try {
          dispatch(setError(null));

          const { data } = await queryFulfilled;
          console.log('[LogoutBySessionId] API response:', {
            isSuccess: data?.isSuccess,
            message: data?.message,
          });

          // Invalidate sessions query to refresh the list
          dispatch(authApi.util.invalidateTags(['Auth']));
        } catch (error: unknown) {
          console.error('[LogoutBySessionId] ❌ Error:', error);
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
        }
      },
    }),

    // Logout from all sessions mutation
    logoutAllSessions: builder.mutation<LogoutResponse, LogoutAllSessionsRequest | void>({
      query: () => ({
        url: '/auth/logout/all',
        method: 'POST',
        body: {} as LogoutAllSessionsRequest, // Empty body
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        console.log('[LogoutAllSessions] Starting logout from all sessions...');

        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          const { data } = await queryFulfilled;
          console.log('[LogoutAllSessions] API response:', {
            isSuccess: data?.isSuccess,
            message: data?.message,
          });

          // Always clear local state - user is logged out from all sessions
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          console.log('[LogoutAllSessions] ✅ Local state cleared');
        } catch (error: unknown) {
          console.error('[LogoutAllSessions] ❌ Error:', error);
          // Always clear local state even on error
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
        }
      },
    }),

    // Logout from all other sessions (keep current) mutation
    logoutAllOtherSessions: builder.mutation<LogoutResponse, LogoutAllOtherSessionsRequest | void>({
      query: () => ({
        url: '/auth/logout/others',
        method: 'POST',
        body: {} as LogoutAllOtherSessionsRequest, // Empty body
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        console.log('[LogoutAllOtherSessions] Starting logout from all other sessions...');

        try {
          dispatch(setError(null));

          const { data } = await queryFulfilled;
          console.log('[LogoutAllOtherSessions] API response:', {
            isSuccess: data?.isSuccess,
            message: data?.message,
          });

          // Don't clear local state - user stays logged in on current session
          // Just invalidate sessions query to refresh the list
          dispatch(authApi.util.invalidateTags(['Auth']));
          console.log('[LogoutAllOtherSessions] ✅ Other sessions logged out, current session remains active');
        } catch (error: unknown) {
          console.error('[LogoutAllOtherSessions] ❌ Error:', error);
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
        }
      },
    }),

    // Refresh token mutation
    refreshToken: builder.mutation<RefreshResponse, RefreshTokenRequest | void>({
      queryFn: async (request, _api, _extraOptions, baseQuery) => {
        // Handle void case
        const req = request || {};
        
        // Get device info directly (not from request body)
        let deviceId: string | null = null;
        let userAgent: string | null = null;
        let ipAddress: string | null = null;

        if (typeof window !== 'undefined') {
          // Get device ID and user agent synchronously
          deviceId = getDeviceId();
          userAgent = getUserAgent();
          
          // Get IP address - try cache first, then fetch if needed
          ipAddress = getCachedIpAddress();
          if (!ipAddress) {
            try {
              const clientInfo = await fetchClientInfo();
              ipAddress = clientInfo.ipAddress;
            } catch (error) {
              console.warn('[Auth Queries] Failed to fetch IP address:', error);
              ipAddress = null;
            }
          }
        }

        // Remove deviceId, userAgent, ipAddress from request to avoid duplication
        const cleanRequest: Omit<RefreshTokenRequest, 'deviceId' | 'userAgent' | 'ipAddress'> = {
          refreshToken: req.refreshToken,
        };

        // Use baseQuery for the actual API call
        const result = await baseQuery({
          url: '/auth/refresh',
          method: 'POST',
          body: {
            refreshToken: cleanRequest.refreshToken || null,
            deviceId,
            userAgent,
            ipAddress,
          },
        });

        return result as typeof result & { data?: RefreshResponse };
      },
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

    // Get sessions paginated query
    getSessionsPaginated: builder.query<GetSessionsPaginatedResponse, GetSessionsPaginatedRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.pageNumber) searchParams.append('pageNumber', params.pageNumber.toString());
        if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
        if (params.userId) searchParams.append('userId', params.userId);
        if (params.deviceId) searchParams.append('deviceId', params.deviceId);
        if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
        if (params.isRevoked !== undefined) searchParams.append('isRevoked', params.isRevoked.toString());
        if (params.isExpired !== undefined) searchParams.append('isExpired', params.isExpired.toString());
        if (params.searchTerm) searchParams.append('searchTerm', params.searchTerm);
        if (params.sortBy) searchParams.append('sortBy', params.sortBy);
        if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);

        return {
          url: `/auth/sessions?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Auth'],
      keepUnusedDataFor: 60, // Keep sessions data for 1 minute
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
  // useSendOtpMutation removed - use NextAuth signIn('send-otp', ...) instead
  // useVerifyOtpMutation removed - use NextAuth signIn('otp', ...) instead
  useGetMeQuery,
  useLogoutMutation,
  useLogoutByRefreshTokenMutation,
  useLogoutBySessionIdMutation,
  useLogoutAllSessionsMutation,
  useLogoutAllOtherSessionsMutation,
  useRefreshTokenMutation,
  useGetSessionsPaginatedQuery,
  useValidateNationalCodeQuery,
  // Lazy query hooks
  useLazyGetMeQuery,
  useLazyGetSessionsPaginatedQuery,
  useLazyValidateNationalCodeQuery,
} = authApi;

// Export the API slice
export default authApi;
