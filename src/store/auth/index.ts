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
  setNationalCode,
  clearChallengeId,
  setUser,
  clearUser,
  setAuthStatus,
  setError,
  setErrorWithType,
  clearError,
  setInitialized,
  reset,
  setLoading,
  setOtpSent,
  setAuthenticated,
  setAnonymous,
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
  selectNationalCode,
  selectAuthError,
  selectAuthErrorType,
  selectIsUserNotFoundError,
  selectAuthErrorInfo,
  selectAuthInfo,
  selectOtpFlowState,
  selectAuthSummary,
  selectUserPermissions,
} from './auth.selectors';

// Export auth query hooks
export {
  useSendOtpMutation,
  // useVerifyOtpMutation removed - use NextAuth signIn('otp', ...) instead
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useValidateNationalCodeQuery,
  useLazyGetMeQuery,
  useLazyValidateNationalCodeQuery,
} from './auth.queries';

// Note: useAuth hook removed - use NextAuth useSession() instead


