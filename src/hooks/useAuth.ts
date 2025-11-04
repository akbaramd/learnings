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
