// src/hooks/useAuth.ts
'use client';

import { useSelector, useDispatch } from 'react-redux';
import {
  selectAuthStatus,
  selectIsAuthenticated,
  selectIsLoading,
  selectUser,
  selectUserId,
  selectUserName,
  selectUserRoles,
  selectChallengeId,
  selectMaskedPhone,
  selectAuthError,
  selectAuthInfo,
  selectOtpFlowState,
  selectAuthSummary,
  selectUserPermissions,
  selectIsSessionLoading,
  selectAuthReady,
  selectCanProceedToOtp,
} from '@/src/store/auth';
import {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useLazyGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
} from '@/src/store/auth';
import {
  clearError,
  reset,
  setAnonymous,
  setInitialized,
} from '@/src/store/auth/auth.slice';

export const useAuth = () => {
  const dispatch = useDispatch();

  // State Selectors
  const authStatus = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const user = useSelector(selectUser);
  const userId = useSelector(selectUserId);
  const userName = useSelector(selectUserName);
  const roles = useSelector(selectUserRoles);
  const challengeId = useSelector(selectChallengeId);
  const maskedPhone = useSelector(selectMaskedPhone);
  const error = useSelector(selectAuthError);
  const authInfo = useSelector(selectAuthInfo);
  const authSummary = useSelector(selectAuthSummary);
  const otpFlow = useSelector(selectOtpFlowState);
  const permissions = useSelector(selectUserPermissions);
  const isSessionLoading = useSelector(selectIsSessionLoading);
  const isReady = useSelector(selectAuthReady);
  const canProceedToOtp = useSelector(selectCanProceedToOtp);

  // API Hooks
  const [sendOtp, sendOtpResult] = useSendOtpMutation();
  const [verifyOtp, verifyOtpResult] = useVerifyOtpMutation();
  const [logout, logoutResult] = useLogoutMutation();
  const [refreshToken, refreshResult] = useRefreshTokenMutation();

  // Lazy query hooks for manual control
  const [triggerGetMe, { data: profileData }] = useLazyGetMeQuery();

  // Action Handlers
  const handleLogout = async () => {
    try {
      await logout({ refreshToken: undefined }).unwrap();
    } catch {
      // fallback: onQueryStarted will already handle reset
    }
  };

  const getUserProfile = async () => {
    try {
      return await triggerGetMe();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  };

  /**
   * Initialize authentication state
   * This should be called once in the root layout to:
   * 1. Check authentication status via /api/auth/me
   * 2. Fetch user profile if authenticated
   * 3. Set initialized flag
   * 
   * @returns Promise that resolves when initialization is complete
   */
  const init = async (): Promise<void> => {
    // If already initialized, skip
    if (isReady) {
      return;
    }

    try {
      // Call /api/auth/me to check authentication status
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      // Check if response is actually JSON (not HTML error page)
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      // If 401, user is not authenticated
      if (res.status === 401) {
        dispatch(setAnonymous());
        dispatch(setInitialized(true));
        return;
      }

      // If response is not JSON (likely an error page), treat as error
      if (!isJson) {
        const text = await res.text();
        console.error('[useAuth.init] /api/auth/me returned non-JSON response:', {
          status: res.status,
          contentType,
          responsePreview: text.substring(0, 200), // First 200 chars
          isHtml: text.trim().startsWith('<!DOCTYPE'),
        });
        // Treat as unauthenticated and mark as initialized
        dispatch(setAnonymous());
        dispatch(setInitialized(true));
        return;
      }

      // If 200, user is authenticated - fetch profile
      if (res.status === 200) {
        const wasPrefetched = res.headers.get('x-me-prefetched') === '1';
        
        if (wasPrefetched) {
          // Parse prefetched response and set user in Redux
          try {
            const clonedRes = res.clone();
            const data = await clonedRes.json();
            if (data?.isSuccess === true && data?.data) {
              const { setUser, setAuthStatus, setInitialized } = await import('@/src/store/auth/auth.slice');
              const userProfile = data.data;
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
              return;
            }
          } catch (parseError) {
            console.error('[useAuth.init] Failed to parse prefetched response:', {
              error: parseError,
              name: parseError instanceof Error ? parseError.name : 'Unknown',
              message: parseError instanceof Error ? parseError.message : String(parseError),
              stack: parseError instanceof Error ? parseError.stack : undefined,
            });
            // Fall through to trigger getMe query
          }
        }

        // If not prefetched or parsing failed, trigger getMe query
        try {
          await triggerGetMe().unwrap();
        } catch (getMeError) {
          // RTK Query error - log details but don't throw
          const errorDetails: Record<string, unknown> = {
            error: getMeError,
            name: getMeError instanceof Error ? getMeError.name : 'Unknown',
            message: getMeError instanceof Error ? getMeError.message : String(getMeError),
          };
          
          // RTK Query errors might have additional properties
          if (getMeError && typeof getMeError === 'object') {
            const rtkError = getMeError as Record<string, unknown>;
            if ('status' in rtkError) errorDetails.status = rtkError.status;
            if ('data' in rtkError) errorDetails.data = rtkError.data;
          }
          
          console.error('[useAuth.init] getMe query failed:', errorDetails);
          // Set anonymous since getMe failed
          dispatch(setAnonymous());
          dispatch(setInitialized(true));
        }
      } else {
        // Other status codes - treat as unauthenticated
        console.warn('[useAuth.init] Unexpected status from /api/auth/me:', res.status);
        dispatch(setAnonymous());
        dispatch(setInitialized(true));
      }
    } catch (error) {
      // Network errors, fetch failures, etc.
      console.error('[useAuth.init] Failed to initialize auth:', {
        error,
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
      });
      // On error, set as anonymous and mark as initialized
      dispatch(setAnonymous()); 
      dispatch(setInitialized(true));
    }
  };

  const resetAuthState = () => dispatch(reset());
  const forceAnonymous = () => dispatch(setAnonymous());
  const clearAuthError = () => dispatch(clearError());

  return {
    // State
    authStatus,
    isAuthenticated,
    isLoading,
    user,
    userId,
    userName,
    roles,
    challengeId,
    maskedPhone,
    error,
    authInfo,
    authSummary,
    otpFlow,
    permissions,
    isSessionLoading,
    isReady,
    canProceedToOtp,

    // API Methods
    sendOtp,
    verifyOtp,
    logout: handleLogout,
    refreshToken,

    // Lazy Query Methods
    getUserProfile,

    // Initialization
    init,

    // Utility Methods
    resetAuthState,
    forceAnonymous,
    clearAuthError,

    // Mutation Results
    sendOtpResult,
    verifyOtpResult,
    logoutResult,
    refreshResult,
    profileData,
  };
};
