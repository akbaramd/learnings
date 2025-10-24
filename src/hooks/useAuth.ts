// src/hooks/useAuth.ts
import { useMemo, useCallback } from 'react';
import { 
  useCheckSessionQuery,
  useGetMeQuery,
  useLogoutMutation,
  selectUser,
  selectIsAuthenticated
} from '@/src/store/auth';
import { useAppSelector } from './store';
import { LoggerFactory } from '@/src/services/logging/ILogger';
import { AppError } from '@/src/services/errors/ErrorTypes';

export function useAuth() {
  // استفاده از RTK Query hooks
  const { 
    data: sessionData, 
    isLoading: isLoadingSession, 
    error: sessionError,
    refetch: refetchSession 
  } = useCheckSessionQuery();
  
  // دریافت user و authentication status از Redux store
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  const { 
    data: userData, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useGetMeQuery(undefined, {
    skip: !isAuthenticated // Use the already available isAuthenticated variable
  });

  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();

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

  // Logout function - simplified to only call API
  const logout = useCallback(async (refreshToken?: string): Promise<void> => {
    const logger = LoggerFactory.getLogger();
    
    try {
      logger.info('Starting logout process', { 
        context: { operation: 'logout', hasRefreshToken: !!refreshToken } 
      });

      // Call RTK mutation which will call the API route
      await logoutMutation({ refreshToken }).unwrap();
      
      logger.info('Logout completed successfully');
    } catch (error) {
      logger.error('Logout process failed', error, { 
        context: { operation: 'logout', hasRefreshToken: !!refreshToken } 
      });
      
      // Even if logout fails, try to clear local state
      try {
        await logoutMutation({ refreshToken }).unwrap();
      } catch (stateError) {
        logger.error('Failed to clear local auth state', stateError);
      }
    }
  }, [logoutMutation]);

  return {
    ...authState,
    logout,
    isLoggingOut
  };
}
