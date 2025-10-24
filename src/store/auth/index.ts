// src/store/auth/index.ts
export { default as authApi } from './auth.queries';
// Export everything from auth store
export { default as authReducer } from './auth.slice';
export * from './auth.slice';
export * from './auth.selectors';
export * from './auth.types';



// Re-export commonly used items
export {
  setChallengeId,
  setMaskedPhoneNumber,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  clearError,
  setInitialized,
  reset,
} from './auth.slice';

export {
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
} from './auth.selectors';

// Export auth query hooks
export {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useCheckSessionQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
} from './auth.queries';

// Export auth hooks
export { useAuth } from '../../hooks/useAuth';
export { useAuthState } from '../../hooks/useAuthState';
export { useAuthGuard } from '../../hooks/useAuthGuard';


