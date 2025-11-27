'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectIsInitialized, selectRefreshTokenChecked } from '@/src/store/auth/auth.selectors';
import { setRefreshTokenChecked, setAccessToken, setAuthStatus } from '@/src/store/auth/auth.slice';
import { useDispatch } from 'react-redux';
import { getDeviceId, getUserAgent, fetchClientInfo, getCachedIpAddress } from '@/src/lib/deviceInfo';
import { signIn, getSession, useSession } from 'next-auth/react';
import { PiSpinner } from 'react-icons/pi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Responsibilities:
 * 1. Protects routes by checking authentication
 * 2. Performs silent refresh if accessToken is null
 * 3. Redirects to login if refresh fails
 * 4. Prevents flicker by showing loading state during check
 * 
 * Flow:
 * 1. On mount: Check if accessToken exists
 * 2. If accessToken exists → render children
 * 3. If accessToken is null → attempt silent refresh
 * 4. If refresh succeeds → render children
 * 5. If refresh fails (401) → redirect to /login
 * 
 * This component should wrap protected pages
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const isInitialized = useSelector(selectIsInitialized);
  const refreshTokenChecked = useSelector(selectRefreshTokenChecked);
  const [checking, setChecking] = useState(true);
  const hasAttemptedRef = useRef(false);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    // Prevent multiple checks
    if (hasAttemptedRef.current) {
      return;
    }

    // 🔥 CRITICAL: Check NextAuth session first (source of truth)
    // If session has accessToken, sync it to Redux
    if (session?.accessToken && !accessToken) {
      dispatch(setAccessToken(session.accessToken));
      dispatch(setAuthStatus('authenticated'));
      setTimeout(() => setChecking(false), 0);
      hasAttemptedRef.current = true;
      return;
    }

    // If we have accessToken in Redux, user is authenticated
    if (accessToken) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setChecking(false), 0);
      hasAttemptedRef.current = true;
      return;
    }

    // If NextAuth session is loading, wait
    if (sessionStatus === 'loading') {
      return;
    }

    // If NextAuth session exists but no accessToken, user is not authenticated
    if (sessionStatus === 'authenticated' && !session?.accessToken) {
      dispatch(setRefreshTokenChecked(true));
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?r=${returnUrl}`);
      hasAttemptedRef.current = true;
      return;
    }

    // If not initialized yet, wait for SilentRefreshProvider
    if (!isInitialized) {
      return;
    }

    // If refreshToken was already checked and failed, redirect immediately
    if (refreshTokenChecked) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?r=${returnUrl}`);
      hasAttemptedRef.current = true;
      return;
    }

    // Mark as attempted
    hasAttemptedRef.current = true;

    // Perform silent refresh using NextAuth
    const performCheck = async () => {
      try {
        // Get device info
        let deviceId: string | null = null;
        let userAgent: string | null = null;
        let ipAddress: string | null = null;

        if (typeof window !== 'undefined') {
          deviceId = getDeviceId();
          userAgent = getUserAgent();
          ipAddress = getCachedIpAddress();
          
          if (!ipAddress) {
            try {
              const clientInfo = await fetchClientInfo();
              ipAddress = clientInfo.ipAddress;
            } catch (error) {
              console.warn('[ProtectedRoute] Failed to fetch IP:', error);
            }
          }
        }

        // 🔥 Use NextAuth signIn('refresh') to refresh tokens
        // This calls the refresh provider which reads refreshToken from cookies
        const refreshResult = await signIn('refresh', {
          deviceId: deviceId || null,
          userAgent: userAgent || null,
          ipAddress: ipAddress || null,
          redirect: false,
        });

        // Check if refresh was successful
        if (refreshResult?.ok) {
          // Get updated session with new accessToken
          const session = await getSession();
          const newAccessToken = session?.accessToken || null;
          
          if (newAccessToken) {
            // Update Redux with new access token
            dispatch(setAccessToken(newAccessToken));
            setChecking(false);
          } else {
            // No accessToken in session after refresh
            dispatch(setRefreshTokenChecked(true));
            const returnUrl = encodeURIComponent(pathname);
            router.replace(`/login?r=${returnUrl}`);
          }
        } else {
          // Refresh failed - mark as checked and redirect to login
          dispatch(setRefreshTokenChecked(true));
          const returnUrl = encodeURIComponent(pathname);
          router.replace(`/login?r=${returnUrl}`);
        }
      } catch {
        // Refresh failed (401, network error, etc.) - mark as checked and redirect to login
        dispatch(setRefreshTokenChecked(true));
        const returnUrl = encodeURIComponent(pathname);
        router.replace(`/login?r=${returnUrl}`);
      }
    };

    performCheck();
  }, [accessToken, isInitialized, refreshTokenChecked, router, pathname, dispatch, session, sessionStatus]);

  // Show loading state while checking
  if (checking) {
    return (
      <div className="h-dvh mx-auto max-w-full sm:max-w-full md:max-w-[30rem] lg:max-w-[30rem] xl:max-w-[30rem] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <PiSpinner className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            در حال بررسی احراز هویت...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  return <>{children}</>;
}

