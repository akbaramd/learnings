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
  setUser,
  setAuthStatus,
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
   * 
   * Fetches user data from /api/auth/me and syncs with Redux
   * This ensures Redux state matches server-side authentication status
   * 
   * @returns Promise that resolves when initialization is complete
   */
  const init = async (): Promise<void> => {
    // If already initialized, skip
    if (isReady) {
      return;
    }

    try {
      console.log('[useAuth.init] Fetching user data from /api/auth/me...');
      
      // Call /api/auth/me to check authentication status and sync Redux
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      // Check if response is actually JSON (not HTML error page)
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      // If 401, user is not authenticated
      if (res.status === 401) {
        console.log('[useAuth.init] User not authenticated (401)');
        dispatch(setAnonymous());
        dispatch(setInitialized(true));
        return;
      }

      // If response is not JSON (likely an error page), treat as error
      if (!isJson) {
        console.warn('[useAuth.init] /api/auth/me returned non-JSON response');
        dispatch(setAnonymous());
        dispatch(setInitialized(true));
        return;
      }

      // If 200, user is authenticated - parse and sync Redux
      if (res.status === 200) {
        const data = await res.json();
        if (data?.isSuccess === true && data?.data) {
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
          console.log('[useAuth.init] User authenticated, syncing Redux:', user.id);
          dispatch(setUser(user));
          dispatch(setAuthStatus('authenticated'));
          dispatch(setInitialized(true));
          return;
        }
      }

      // Other status codes or invalid response - treat as not authenticated
      console.warn('[useAuth.init] Unexpected status or invalid response:', res.status);
      dispatch(setAnonymous());
      dispatch(setInitialized(true));
    } catch (error) {
      // Network errors, fetch failures, etc.
      console.error('[useAuth.init] Failed to initialize auth:', error);
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
