'use client';

import { usePathname } from 'next/navigation';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';

interface AuthSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that syncs auth state across browser tabs
 * Uses BroadcastChannel to notify all tabs when logout occurs
 * Only initializes auth on protected pages, not on public pages
 */
export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const pathname = usePathname();
  
  // Check if current page is public
  const publicPaths = ['/login', '/verify-otp', '/'];
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname?.startsWith(path + '/')
  );
  
  // Only call useAuthGuard on protected pages
  // This prevents session check on login/verify-otp pages
  const authGuardConfig = {
    publicPaths,
    autoInit: !isPublicPath, // Only auto-init on protected pages
    crossTab: true,
    autoRedirect: !isPublicPath, // Only auto-redirect on protected pages
    channelName: 'auth-sync',
  };
  
  useAuthGuard(authGuardConfig);
  
  return <>{children}</>;
}

