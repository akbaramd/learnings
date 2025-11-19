'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';

interface NextAuthProviderProps {
  children: ReactNode;
  /**
   * Optional initial session to pass to SessionProvider
   * If not provided, SessionProvider will fetch it automatically
   */
  session?: Session | null;
}

/**
 * NextAuth SessionProvider wrapper
 * Provides session context to all client components
 * 
 * Standard NextAuth configuration:
 * - refetchInterval: 0 (disable automatic polling)
 * - refetchOnWindowFocus: true (refetch when user returns to tab)
 * - refetchWhenOffline: false (don't refetch when offline)
 * - basePath: '/api/auth' (explicit base path for NextAuth endpoints)
 */
export function NextAuthProvider({ children, session }: NextAuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}

