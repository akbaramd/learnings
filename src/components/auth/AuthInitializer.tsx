'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * AuthInitializer Component
 * 
 * Responsibilities:
 * 1. Monitor NextAuth session status changes
 * 2. Handle route-based redirects:
 *    - API endpoints: Excluded (handle their own server-side authentication)
 *    - (anonymous) and (auth) routes: No auth required
 *    - All other routes: Require authentication, redirect to login if not authenticated
 * 
 * Note: NextAuth handles initialization automatically - no need to call init()
 */
export function AuthInitializer() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const redirectInitiatedRef = useRef(false);

  const isAuthenticated = status === 'authenticated' && !!session;
  const isReady = status !== 'loading';

  // Handle route-based redirects based on auth status
  useEffect(() => {
    // Skip API endpoints - they handle their own server-side authentication
    if (pathname.startsWith('/api')) {
      return;
    }

    // Don't handle redirects until session status is determined
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
      if (isAuthRoute && isAuthenticated) {
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
    if (!isAuthenticated) {
      redirectInitiatedRef.current = true;
      // Redirect to login with returnUrl
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?r=${returnUrl}`);
    }
  }, [isReady, isAuthenticated, pathname, router]);

  // Reset redirect flag when pathname changes (to allow new redirects)
  useEffect(() => {
    redirectInitiatedRef.current = false;
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

