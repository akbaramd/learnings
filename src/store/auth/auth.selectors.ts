// src/store/auth/auth.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selector for auth state
const selectAuthState = (state: RootState) => state.auth;

// Auth status selectors
export const selectAuthStatus = createSelector(
  [selectAuthState],
  (auth) => auth.status
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.status === 'authenticated'
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

export const selectHasChallengeId = createSelector(
  [selectChallengeId],
  (challengeId) => !!challengeId
);

// Error selectors
export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

export const selectHasAuthError = createSelector(
  [selectAuthError],
  (error) => !!error
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
    error: auth.error,
  })
);

export const selectUserPermissions = createSelector(
  [selectUserRoles],
  (roles) => ({
    canAccessAdmin: roles.includes('admin') || roles.includes('super_admin'),
    canManageUsers: roles.includes('admin') || roles.includes('user_manager'),
    canViewReports: roles.includes('admin') || roles.includes('reporter'),
    hasRole: (role: string) => roles.includes(role),
  })
);

// Loading state selectors
export const selectIsAuthLoading = createSelector(
  [selectAuthStatus],
  (status) => status === 'loading'
);

export const selectIsSessionLoading = createSelector(
  [selectAuthStatus],
  (status) => status === 'loading' && !selectIsInitialized
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
