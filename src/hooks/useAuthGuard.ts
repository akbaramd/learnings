// src/hooks/useAuthGuard.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCheckSessionQuery, selectAuthStatus } from '@/src/store/auth';
import { useAppSelector } from './store';

export function useAuthGuard(redirectTo: string = '/') {
  const router = useRouter();
  const { data: sessionData, isLoading: isCheckingSession } = useCheckSessionQuery();
  const authStatus = useAppSelector(selectAuthStatus);
  
  useEffect(() => {
    if (!isCheckingSession && sessionData?.result?.authenticated) {
      router.push(redirectTo);
    }
  }, [sessionData, isCheckingSession, router, redirectTo]);
  
  return {
    isAuthenticated: sessionData?.result?.authenticated || false,
    isLoading: isCheckingSession,
    authStatus
  };
}
