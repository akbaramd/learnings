'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/src/hooks/useToast';
import { isAuthPage } from '@/src/lib/auth-utils';

/**
 * ProtectedRouteGuard Component
 * 
 * This component handles redirects for protected routes when authentication fails.
 * It should ONLY be used in protected route layouts (e.g., app/(protected)/layout.tsx).
 * 
 * Responsibilities:
 * 1. Monitor NextAuth session status changes
 * 2. Redirect to login when user becomes unauthenticated (401, session expired, etc.)
 * 3. Prevent infinite loops by checking current pathname
 * 4. Only redirect when session status is determined
 * 
 * IMPORTANT: Uses NextAuth session for authentication state
 */
export function ProtectedRouteGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { info: showInfoToast } = useToast();
  const redirectInitiatedRef = useRef(false);
  const lastPathnameRef = useRef<string | null>(null);

  // Listen for logout events to show toast notifications
  useEffect(() => {
    const handleLogoutEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: string }>;
      if (customEvent.detail?.message) {
        showInfoToast('خروج از حساب کاربری', customEvent.detail.message);
      }
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, [showInfoToast]);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    if (lastPathnameRef.current !== pathname) {
      redirectInitiatedRef.current = false;
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    // Don't redirect until session status is determined
    if (status === 'loading') {
      return;
    }

    // Prevent multiple redirects
    if (redirectInitiatedRef.current) {
      return;
    }

    // Only redirect if user is not authenticated
    if (status === 'unauthenticated' || !session) {
      // Prevent redirect if we're already on login page (infinite loop prevention)
      if (isAuthPage(pathname)) {
        console.log('[ProtectedRouteGuard] Already on auth page, skipping redirect to prevent loop');
        return;
      }

      redirectInitiatedRef.current = true;
      
      console.log('[ProtectedRouteGuard] User not authenticated, redirecting to login:', {
        pathname,
        status,
        hasSession: !!session,
      });
      
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?r=${returnUrl}`);
    }
  }, [status, session, pathname, router]);

  // This component doesn't render anything
  return null;
}

