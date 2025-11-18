'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';

/**
 * AuthInitializer Component
 * 
 * Responsibilities:
 * 1. Initialize authentication state on mount (calls useAuth.init)
 * 2. Monitor authentication status changes
 * 3. Handle route-based redirects:
 *    - API endpoints: Excluded (handle their own server-side authentication)
 *    - (anonymous) and (auth) routes: No auth required
 *    - All other routes: Require authentication, redirect to login if not authenticated
 */
export function AuthInitializer() {
  const { init, isReady, isAuthenticated, authStatus } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const initCalledRef = useRef(false);
  const redirectInitiatedRef = useRef(false);

  // Initialize auth on mount (only once)
  // Skip initialization on auth pages and API endpoints - we don't need to check auth status there
  useEffect(() => {
    console.log('[AuthInitializer] pathname:', pathname);
    // Skip API endpoints - they handle their own server-side authentication
    if (pathname.startsWith('/api')) {
      return;
    }

    // Check if we're on an auth page - skip init on these pages
    const isAuthRoute = pathname === '/login' || pathname === '/verify-otp';
    const isAnonymousRoute = pathname.startsWith('/public');
    
    // Skip initialization on auth/anonymous pages
    if (isAuthRoute || isAnonymousRoute) {
      return;
    }

    if (!initCalledRef.current) {
      initCalledRef.current = true;
      init().catch((error) => {
        console.error('[AuthInitializer] Failed to initialize auth:', error);
      });
    }
  }, [init, pathname]);

  // Handle route-based redirects based on auth status
  useEffect(() => {
    // Skip API endpoints - they handle their own server-side authentication
    if (pathname.startsWith('/api')) {
      return;
    }

    // Don't handle redirects until auth is initialized
    if (!isReady) {
      return;
    }

    // Prevent multiple redirects
    if (redirectInitiatedRef.current) {
      return;
    }

    // Check if current route is in (anonymous) or (auth) route groups
    // These routes don't require authentication
    const isAnonymousRoute = pathname.startsWith('/public');
    const isAuthRoute = pathname === '/login' || pathname === '/verify-otp';
    const isPublicRoute = isAnonymousRoute || isAuthRoute;

    // If route is public, allow access regardless of auth status
    if (isPublicRoute) {
      // If user is authenticated and on auth pages, redirect to dashboard
      if (isAuthRoute && isAuthenticated && authStatus === 'authenticated') {
        // Check for logout query param - if present, allow access (logout flow)
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('logout') !== 'true') {
          const returnUrl = searchParams.get('r');
          const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
          redirectInitiatedRef.current = true;
          router.push(redirectTo);
        }
      }
      return;
    }

    // For all other routes (protected routes and root), require authentication
    if (!isAuthenticated || authStatus === 'anonymous') {
      redirectInitiatedRef.current = true;
      // If user just logged out (anonymous status), redirect to root (/)
      // Root page will handle redirect to login
      if (authStatus === 'anonymous') {
        router.push('/');
      } else {
        // Not logged out, just not authenticated - redirect to login with returnUrl
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?r=${returnUrl}`);
      }
    }
  }, [isReady, isAuthenticated, authStatus, pathname, router]);

  // Reset redirect flag when pathname changes (to allow new redirects)
  useEffect(() => {
    redirectInitiatedRef.current = false;
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

