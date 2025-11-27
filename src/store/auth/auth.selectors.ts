// src/store/auth/auth.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { UserRole } from './auth.types';

// Base selector for auth state with validation
const selectAuthState = (state: RootState) => {
  const auth = state.auth;
  // Validate auth state structure
  if (!auth || typeof auth !== 'object') {
    console.warn('Invalid auth state structure');
    return {
      status: 'idle' as const,
      user: null,
      challengeId: null,
      maskedPhoneNumber: null,
      nationalCode: null,
      error: null,
      errorType: null,
      isInitialized: false,
      accessToken: null,
      refreshTokenChecked: false,
    };
  }
  return auth;
};

// Auth status selectors
export const selectAuthStatus = createSelector(
  [selectAuthState],
  (auth) => auth.status
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.status === 'authenticated'
);
export const selectAccessToken = createSelector(
  [selectAuthState],
  (auth) => auth.accessToken
);

export const selectRefreshTokenChecked = createSelector(
  [selectAuthState],
  (auth) => auth.refreshTokenChecked
);

export const selectIsAuthenticatedWithAccessToken = createSelector(
  [selectAuthState],
  (auth) => auth.status === 'authenticated' && !!auth.accessToken
);

export const selectIsLoading = createSelector(
  [selectAuthState],
  (auth) => auth.status === 'loading'
);

export const selectIsInitialized = createSelector(
  [selectAuthState],
  (auth) => auth.isInitialized
);

// User data selectors
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectUserId = createSelector(
  [selectUser],
  (user) => user?.id || null
);

export const selectUserName = createSelector(
  [selectUser],
  (user) => user?.userName || null
);

export const selectUserRoles = createSelector(
  [selectUser],
  (user) => user?.roles || []
);

export const selectUserFullName = createSelector(
  [selectUser],
  (user) => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.userName;
  }
);

// Challenge ID selectors (for OTP flow)
export const selectChallengeId = createSelector(
  [selectAuthState],
  (auth) => auth.challengeId
);

export const selectMaskedPhone = createSelector(
  [selectAuthState],
  (auth) => auth.maskedPhoneNumber  
);

export const selectNationalCode = createSelector(
  [selectAuthState],
  (auth) => auth.nationalCode
);

export const selectHasChallengeId = createSelector(
  [selectChallengeId],
  (challengeId) => !!challengeId
);

// Error selectors
export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export const selectAuthErrorType = createSelector(
  [selectAuthState],
  (auth) => auth.errorType
);

export const selectHasAuthError = createSelector(
  [selectAuthError],
  (error) => !!error
);

export const selectIsUserNotFoundError = createSelector(
  [selectAuthErrorType],
  (errorType) => errorType === 'user_not_found'
);

export const selectAuthErrorInfo = createSelector(
  [selectAuthError, selectAuthErrorType],
  (error, errorType) => ({
    message: error,
    type: errorType,
    isUserNotFound: errorType === 'user_not_found',
    isInvalidCredentials: errorType === 'invalid_credentials',
    isOtpFailed: errorType === 'otp_failed',
    isNetworkError: errorType === 'network_error',
    isServerError: errorType === 'server_error',
  })
);

// Combined selectors for convenience
export const selectAuthInfo = createSelector(
  [selectAuthState],
  (auth) => ({
    status: auth.status,
    isAuthenticated: auth.status === 'authenticated',
    isLoading: auth.status === 'loading',
    isInitialized: auth.isInitialized,
    user: auth.user,
    challengeId: auth.challengeId,
    maskedPhone: auth.maskedPhoneNumber,
    nationalCode: auth.nationalCode,
    error: auth.error,
    errorType: auth.errorType,
  })
);

export const selectUserPermissions = createSelector(
  [selectUserRoles],
  (roles) => ({
    canAccessAdmin: roles.includes('admin' as UserRole) || roles.includes('super_admin' as UserRole),
    canManageUsers: roles.includes('admin' as UserRole) || roles.includes('user_manager' as UserRole),
    canViewReports: roles.includes('admin' as UserRole) || roles.includes('reporter' as UserRole),
    hasRole: (role: UserRole) => roles.includes(role),
  })
);

// Loading state selectors (remove duplicate)
export const selectIsSessionLoading = createSelector(
  [selectAuthStatus, selectIsInitialized],
  (status, isInitialized) => status === 'loading' && !isInitialized
);

// Combined selectors for common use cases
export const selectAuthReady = createSelector(
  [selectIsInitialized, selectIsLoading],
  (isInitialized, isLoading) => isInitialized && !isLoading
);

export const selectCanProceedToOtp = createSelector(
  [selectHasChallengeId, selectIsLoading],
  (hasChallengeId, isLoading) => hasChallengeId && !isLoading
);

// OTP flow state selector
export const selectOtpFlowState = createSelector(
  [selectAuthStatus, selectHasChallengeId, selectMaskedPhone],
  (status, hasChallengeId, maskedPhone) => ({
    isOtpSent: status === 'otp-sent',
    hasChallengeId,
    maskedPhone,
    canVerifyOtp: hasChallengeId && status === 'otp-sent',
  })
);

// Auth state summary selector
export const selectAuthSummary = createSelector(
  [selectAuthStatus, selectIsAuthenticated, selectIsLoading, selectIsInitialized, selectUser],
  (status, isAuthenticated, isLoading, isInitialized, user) => ({
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasUser: !!user,
    userId: user?.id,
    userName: user?.userName,
  })
);
