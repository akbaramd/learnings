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
  useLazyCheckSessionQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
} from '@/src/store/auth';
import {
  clearError,
  reset,
  setAnonymous,
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
  const { hasUser } = authSummary;

  // API Hooks
  const [sendOtp, sendOtpResult] = useSendOtpMutation();
  const [verifyOtp, verifyOtpResult] = useVerifyOtpMutation();
  const [logout, logoutResult] = useLogoutMutation();
  const [refreshToken, refreshResult] = useRefreshTokenMutation();

  // Lazy query hooks for manual control
  const [triggerCheckSession, { data: sessionData, isFetching: isSessionFetching }] = useLazyCheckSessionQuery();
  const [triggerGetMe, { data: profileData }] = useLazyGetMeQuery();

  // Action Handlers
  const handleLogout = async () => {
    try {
      await logout({ refreshToken: undefined }).unwrap();
    } catch {
      // fallback: onQueryStarted will already handle reset
    }
  };

  // Manual session and profile checks
  const checkSession = async () => {
    try {
      const result = await triggerCheckSession();
      
      // Validate session: must have HTTP 200, isSuccess=true, and authenticated=true
      // Access meta safely - check if result is fulfilled and has meta
      const httpStatus = result.isSuccess && 'meta' in result && result.meta 
        ? (result.meta as { response?: { status?: number } })?.response?.status 
        : undefined;  
      const isValidSession = httpStatus === 200 && 
                             result.data?.isSuccess === true && 
                             result.data?.data?.authenticated === true;
      
      if (!isValidSession) {
        // Session is invalid - logout will be handled by onQueryStarted
        console.warn('Session check returned invalid session:', {
          httpStatus,
          isSuccess: result.data?.isSuccess,
          authenticated: result.data?.data?.authenticated,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to check session:', error);
      // Error handling (logout) is done in onQueryStarted
      throw error;
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

  const refreshAuthData = async () => {
    try {
      // Always check session first
      const sessionResult = await triggerCheckSession();
      
      // Validate session response - access meta safely
      const httpStatus = sessionResult.isSuccess && 'meta' in sessionResult && sessionResult.meta
        ? (sessionResult.meta as { response?: { status?: number } })?.response?.status
        : undefined;
      const isValidSession = httpStatus === 200 && 
                             sessionResult.data?.isSuccess === true && 
                             sessionResult.data?.data?.authenticated === true;
      
      if (!isValidSession) {
        // Session invalid - logout handled by onQueryStarted
        return { success: false, error: 'Session invalid' };
      }
      
      // Only get profile if authenticated and don't have user data
      if (isAuthenticated && !hasUser) {
        try {
          await triggerGetMe();
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Continue even if profile fetch fails
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh auth data:', error);
      // Logout handling is done in onQueryStarted
      return { success: false, error };
    }
  };

  // Initialize auth state - call this when the app starts
  const initializeAuth = async () => {
    try {
      // Only check session if we don't have any auth state yet
      if (authStatus === 'idle' || authStatus === 'loading') {
        const sessionResult = await triggerCheckSession();
        
        // Validate session: must have HTTP 200, isSuccess=true, and authenticated=true
        // Access meta safely - check if result is fulfilled and has meta
        const httpStatus = sessionResult.isSuccess && 'meta' in sessionResult && sessionResult.meta
          ? (sessionResult.meta as { response?: { status?: number } })?.response?.status
          : undefined;
        const isValidSession = httpStatus === 200 && 
                               sessionResult.data?.isSuccess === true && 
                               sessionResult.data?.data?.authenticated === true;
        
        if (!isValidSession) {
          // Session invalid - logout will be handled by onQueryStarted
          return { success: false, error: 'Session invalid' };
        }
      }
      
      // Get user profile if authenticated but don't have user data
      if (isAuthenticated && !hasUser) {
        try {
          await triggerGetMe();
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Continue even if profile fetch fails
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Error handling (logout) is done in onQueryStarted
      return { success: false, error };
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
    isSessionFetching,
    isReady,
    canProceedToOtp,

    // API Methods
    sendOtp,
    verifyOtp,
    logout: handleLogout,
    refreshToken,

    // Lazy Query Methods
    checkSession,
    getUserProfile,
    refreshAuthData,
    initializeAuth,

    // Utility Methods
    resetAuthState,
    forceAnonymous,
    clearAuthError,

    // Mutation Results
    sendOtpResult,
    verifyOtpResult,
    logoutResult,
    refreshResult,
    sessionData,
    profileData,
  };
};
