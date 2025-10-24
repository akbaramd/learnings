// src/hooks/useAuth.ts
import { useMemo } from 'react';
import { 
  useCheckSessionQuery,
  useGetMeQuery,
  useLogoutMutation,
  selectUser,
  selectIsAuthenticated
} from '@/src/store/auth';
import { useAppSelector } from './store';

export function useAuth() {
  // استفاده از RTK Query hooks
  const { 
    data: sessionData, 
    isLoading: isLoadingSession, 
    error: sessionError,
    refetch: refetchSession 
  } = useCheckSessionQuery();
  
  const { 
    data: userData, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useGetMeQuery(undefined, {
    skip: !sessionData?.result?.authenticated // فقط اگر authenticated باشد، user data را بگیر
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // دریافت user و authentication status از Redux store
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // محاسبه وضعیت authentication
  const authState = useMemo(() => {
    const isLoading = isLoadingSession || (isAuthenticated && isLoadingUser);
    const hasError = !!sessionError || !!userError;
    
    return {
      isAuthenticated,
      isLoading,
      hasError,
      user,
      sessionData,
      userData,
      sessionError,
      userError,
      refetchSession,
    };
  }, [
    sessionData,
    userData,
    isLoadingSession,
    isLoadingUser,
    sessionError,
    userError,
    refetchSession,
    isAuthenticated,
    user
  ]);

  // Logout function
  const logout = async () => {
    try {
      await logoutMutation().unwrap();
      // The logout mutation will handle clearing the auth state
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    ...authState,
    logout,
    isLoggingOut
  };
}
