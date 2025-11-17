// src/store/auth/auth.queries.ts
import { createApi } from '@reduxjs/toolkit/query/react';
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
  GetSessionsPaginatedRequest,
  GetSessionsPaginatedResponse,
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
    // Send OTP mutation (login endpoint)
    sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
      queryFn: async (credentials, _api, _extraOptions, baseQuery) => {
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

        // Remove deviceId, userAgent, ipAddress from credentials to avoid duplication
        const cleanCredentials: Omit<SendOtpRequest, 'deviceId' | 'userAgent' | 'ipAddress'> = {
          nationalCode: credentials.nationalCode,
          purpose: credentials.purpose,
          scope: credentials.scope,
        };

        // Use baseQuery for the actual API call
        const result = await baseQuery({
          url: '/auth/login',
          method: 'POST',
          body: {
            ...cleanCredentials,
            deviceId,
            userAgent,
            ipAddress,
            scope: cleanCredentials.scope || 'app', // Default scope to 'app'
          },
        });

        return result as typeof result & { data?: SendOtpResponse };
      },
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
            // Store national code for resending OTP (handle undefined)
            if (arg.nationalCode) {
              dispatch(setNationalCode(arg.nationalCode));
            }
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
      queryFn: async (credentials, _api, _extraOptions, baseQuery) => {
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

        // Remove deviceId, userAgent, ipAddress from credentials to avoid duplication
        const cleanCredentials: Omit<VerifyOtpRequest, 'deviceId' | 'userAgent' | 'ipAddress'> = {
          challengeId: credentials.challengeId,
          otpCode: credentials.otpCode,
          purpose: credentials.purpose,
          scope: credentials.scope,
        };

        // Use baseQuery for the actual API call
        const result = await baseQuery({
          url: '/auth/verify-otp',
          method: 'POST',
          body: {
            ...cleanCredentials,
            deviceId,
            userAgent,
            ipAddress,
            scope: cleanCredentials.scope || 'app', // Default scope to 'app'
          },
        });

        return result as typeof result & { data?: VerifyOtpResponse };
      },
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        console.log('[VerifyOtp Mutation] onQueryStarted - Starting OTP verification...');
        try {
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));
          console.log('[VerifyOtp Mutation] Set authStatus to loading');

          const { data } = await queryFulfilled;
          console.log('[VerifyOtp Mutation] Query fulfilled:', {
            isSuccess: data?.isSuccess,
            hasUserId: !!data?.data?.userId,
            userId: data?.data?.userId,
            fullData: JSON.stringify(data, null, 2),
          });

          // Check isSuccess flag - must be true for success
          if (data?.isSuccess === true && data?.data?.userId) {
            console.log('[VerifyOtp Mutation] ✅ OTP verification successful!');
            console.log('[VerifyOtp Mutation] Clearing challengeId...');
            dispatch(clearChallengeId());
            
            console.log('[VerifyOtp Mutation] Setting authStatus to authenticated...');
            dispatch(setAuthStatus('authenticated'));
            
            console.log('[VerifyOtp Mutation] Dispatching getMe.initiate() to fetch user profile...');
            // Fetch user profile after successful verification
            dispatch(authApi.endpoints.getMe.initiate());
            console.log('[VerifyOtp Mutation] ✅ All dispatches completed');
          } else {
            console.warn('[VerifyOtp Mutation] ⚠️ OTP verification failed:', {
              isSuccess: data?.isSuccess,
              hasUserId: !!data?.data?.userId,
              message: data?.message,
              errors: data?.errors,
            });
            const errorMessage = data?.message || data?.errors?.[0] || 'OTP verification failed.';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
            dispatch(setAuthStatus('error'));
            console.log('[VerifyOtp Mutation] Set authStatus to error');
          }
        } catch (error: unknown) {
          console.error('[VerifyOtp Mutation] ❌ Error in onQueryStarted:', error);
          const { message, type } = categorizeAuthError(error);
          dispatch(setErrorWithType({ message, type }));
          dispatch(setAuthStatus('error'));
          console.log('[VerifyOtp Mutation] Set authStatus to error after catch');
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

    // Logout mutation
    logout: builder.mutation<LogoutResponse, { refreshToken?: string }>({
      query: ({ refreshToken }) => ({
        url: '/auth/logout',
        method: 'POST',
        body: { refreshToken: refreshToken || null },
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        console.log('[Logout Mutation] onQueryStarted - Starting logout mutation...');
        try {
          console.log('[Logout Mutation] Setting status to loading...');
          dispatch(setAuthStatus('loading'));
          dispatch(setError(null));

          console.log('[Logout Mutation] Waiting for API response...');
          const { data } = await queryFulfilled;
          console.log('[Logout Mutation] API response received:', data);

          // Check isSuccess flag
          if (data?.isSuccess === true && data?.data?.isSuccess) {
            console.log('[Logout Mutation] Logout successful, clearing state...');
            dispatch(clearUser());
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('anonymous'));
            console.log('[Logout Mutation] State cleared, status set to anonymous');
          } else {
            console.log('[Logout Mutation] Logout response indicates failure, but clearing state for security...');
            // Even if logout fails on server, clear local state for security
            dispatch(clearUser());
            dispatch(clearChallengeId());
            dispatch(setAuthStatus('anonymous'));
            console.log('[Logout Mutation] State cleared despite API failure');
            const errorMessage = data?.message || data?.errors?.[0] || 'Logout failed';
            const { message, type } = categorizeAuthError({ data });
            dispatch(setErrorWithType({ message: errorMessage || message, type }));
          }
        } catch (err: unknown) {
          console.error('[Logout Mutation] Error during logout:', err);
          // Even if logout fails on server, clear local state
          console.log('[Logout Mutation] Clearing state due to error...');
          dispatch(clearUser());
          dispatch(clearChallengeId());
          dispatch(setAuthStatus('anonymous'));
          console.log('[Logout Mutation] State cleared after error');
          
          const { message, type } = categorizeAuthError(err);
          dispatch(setErrorWithType({ message, type }));
        }
        console.log('[Logout Mutation] onQueryStarted completed');
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
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetMeQuery,
  useLogoutMutation,
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
