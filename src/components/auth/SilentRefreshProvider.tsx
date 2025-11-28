'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccessToken, selectIsInitialized } from '@/src/store/auth/auth.selectors';
import { setAccessToken, setInitialized, setAuthStatus } from '@/src/store/auth/auth.slice';
import { getDeviceId, getUserAgent, fetchClientInfo, getCachedIpAddress } from '@/src/lib/deviceInfo';
import { signIn, getSession } from 'next-auth/react';

/**
 * SilentRefreshProvider
 *
 * Responsibilities:
 * 1. Performs silent refresh on mount (after F5, new tab, etc.)
 * 2. Updates Redux accessToken from refresh response
 * 3. Sets initialized state after refresh attempt
 *
 * Flow:
 * - On mount: accessToken is usually null (after page refresh)
 * - If no accessToken: attempt silent refresh via NextAuth signIn('refresh')
 * - If successful: set accessToken in Redux
 * - If failed: leave accessToken null (user will be redirected by ProtectedRoute)
 *
 * This runs once per app load
 */
export function SilentRefreshProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const isInitialized = useSelector(selectIsInitialized);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Only attempt once per app load
    if (hasAttemptedRef.current) {
      return;
    }

    // If we already have an accessToken, just mark as initialized
    if (accessToken) {
      if (!isInitialized) {
        dispatch(setInitialized(true));
      }
      hasAttemptedRef.current = true;
      return;
    }

    // Mark as attempted
    hasAttemptedRef.current = true;

    // Perform silent refresh using NextAuth
    const performSilentRefresh = async () => {
      try {
        // Get device info
        let deviceId: string | null = null;
        let userAgent: string | null = null;
        let ipAddress: string | null = null;

        if (typeof window !== 'undefined') {
          deviceId = getDeviceId();
          userAgent = getUserAgent();
          ipAddress = getCachedIpAddress();

          // Fetch IP if not cached
          if (!ipAddress) {
            try {
              const clientInfo = await fetchClientInfo();
              ipAddress = clientInfo.ipAddress;
            } catch (error) {
              console.warn('[SilentRefresh] Failed to fetch IP address:', error);
            }
          }
        }

        // Attempt refresh via NextAuth
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
            dispatch(setAuthStatus('authenticated'));

            if (process.env.NODE_ENV === 'development') {
              console.log('[SilentRefresh] ✅ Token refreshed successfully');
            }
          } else {
            // No accessToken in session after refresh
            dispatch(setAccessToken(null));
            dispatch(setAuthStatus('anonymous'));

            if (process.env.NODE_ENV === 'development') {
              console.log('[SilentRefresh] ❌ No accessToken in session after refresh');
            }
          }
        } else {
          // Refresh failed - leave accessToken null
          dispatch(setAccessToken(null));
          dispatch(setAuthStatus('anonymous'));

          if (process.env.NODE_ENV === 'development') {
            console.log('[SilentRefresh] ❌ Token refresh failed:', refreshResult?.error);
          }
        }
      } catch (error) {
        // Refresh failed - leave accessToken null
        dispatch(setAccessToken(null));
        dispatch(setAuthStatus('anonymous'));

        if (process.env.NODE_ENV === 'development') {
          console.log('[SilentRefresh] ❌ Token refresh error:', error);
        }
      } finally {
        // Mark as initialized regardless of success/failure
        dispatch(setInitialized(true));
      }
    };

    performSilentRefresh();
  }, [accessToken, isInitialized, dispatch]);

  return <>{children}</>;
}

