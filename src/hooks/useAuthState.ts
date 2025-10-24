// src/hooks/useAuthState.ts
// Custom hook for authentication state management using RTK Query

import { useMemo } from 'react';
import { 
  useCheckSessionQuery,
  useGetMeQuery 
} from '@/src/store/auth';

export function useAuthState() {
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

  // محاسبه وضعیت authentication
  const authState = useMemo(() => {
    const isAuthenticated = sessionData?.result?.authenticated || false;
    const isLoading = isLoadingSession || (isAuthenticated && isLoadingUser);
    const hasError = !!sessionError || !!userError;
    const user = userData?.result || null;
    
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
    refetchSession
  ]);

  return authState;
}
