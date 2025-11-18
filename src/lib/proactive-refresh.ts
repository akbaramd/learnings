/**
 * Proactive Token Refresh Utility
 * Implements proactive token refresh before expiration (Hybrid Approach)
 * 
 * This works with the BFF architecture by triggering refresh requests
 * before the token expires, improving UX and reducing 401 errors
 */

import { authApi } from '@/src/store/auth/auth.queries';
import { AppDispatch } from '@/src/store';
import { isPWAAvailable, getRefreshToken } from './pwa-storage';

let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;

/**
 * Decode JWT token to extract expiration time
 * Note: This is a simple base64 decode. For production, use a proper JWT library
 */
function decodeJWT(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('[Proactive Refresh] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get access token from /api/auth/me endpoint
 * In BFF architecture, we call /api/auth/me which returns user data
 * We can decode the token from cookies on client-side if needed, but for proactive refresh
 * we'll use the token from Redux state or trigger refresh directly
 */
async function getAccessTokenFromServer(): Promise<string | null> {
  try {
    // Try to get user data - if successful, user is authenticated
    // For proactive refresh, we don't need the actual token, just need to know if user is authenticated
    // The refresh endpoint will handle token refresh using cookies
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      // User is authenticated - we can proceed with proactive refresh
      // The actual token refresh will use cookies server-side
      return 'authenticated'; // Return a marker, actual token is in cookies
    }
  } catch (error) {
    console.error('[Proactive Refresh] Failed to check auth status:', error);
  }

  return null;
}

/**
 * Start proactive token refresh timer
 * Refreshes token 2 minutes before expiration (8 minutes into 10-minute token)
 * 
 * @param dispatch - Redux dispatch function
 * @param accessToken - Current access token (optional, will be fetched if not provided)
 */
export async function startProactiveRefresh(
  dispatch: AppDispatch,
  accessToken?: string | null
): Promise<void> {
  // Clear existing timer
  stopProactiveRefresh();

  // Check if user is authenticated
  const authStatus = await getAccessTokenFromServer();
  if (!authStatus) {
    console.log('[Proactive Refresh] User is not authenticated, skipping proactive refresh');
    return;
  }

  // For proactive refresh, we'll refresh the token 8 minutes after page load
  // (assuming 10-minute token lifetime, refresh 2 minutes before expiry)
  // This is a simple approach - in production, you might want to decode JWT from cookies
  // But since tokens are in HttpOnly cookies, we can't access them client-side
  // So we'll use a fixed interval approach
  
  const refreshInterval = 8 * 60 * 1000; // 8 minutes (refresh 2 minutes before 10-minute expiry)
  
  console.log('[Proactive Refresh] Scheduling refresh in', Math.round(refreshInterval / 1000), 'seconds');

  // Schedule refresh
  refreshTimer = setTimeout(async () => {
    await triggerRefresh(dispatch);
    // After refresh, restart the timer
    // This will be handled by the component that calls startProactiveRefresh
  }, refreshInterval);
}

/**
 * Stop proactive refresh timer
 */
export function stopProactiveRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    console.log('[Proactive Refresh] Timer stopped');
  }
}

/**
 * Trigger token refresh
 * Uses the refresh token from cookies (BFF) or IndexedDB (PWA)
 */
async function triggerRefresh(dispatch: AppDispatch): Promise<void> {
  if (isRefreshing) {
    console.log('[Proactive Refresh] Refresh already in progress, skipping');
    return;
  }

  isRefreshing = true;
  console.log('[Proactive Refresh] Triggering proactive token refresh...');

  try {
    // In BFF architecture, refresh is handled server-side via cookies
    // We just need to call the refresh endpoint
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Proactive Refresh] Token refreshed successfully');

      // If PWA is available, also save to IndexedDB
      if (isPWAAvailable() && data?.data?.refreshToken) {
        const { saveRefreshToken } = await import('./pwa-storage');
        await saveRefreshToken(data.data.refreshToken);
      }

      // Sync Redux state by fetching user profile
      dispatch(authApi.endpoints.getMe.initiate());
    } else {
      console.error('[Proactive Refresh] Token refresh failed:', response.status);
      
      // If refresh fails, stop proactive refresh
      stopProactiveRefresh();
    }
  } catch (error) {
    console.error('[Proactive Refresh] Error refreshing token:', error);
    stopProactiveRefresh();
  } finally {
    isRefreshing = false;
  }
}

/**
 * Initialize proactive refresh
 * Should be called after successful login or token refresh
 * 
 * @param dispatch - Redux dispatch function
 * @param accessToken - Current access token (optional)
 */
export async function initProactiveRefresh(
  dispatch: AppDispatch,
  accessToken?: string | null
): Promise<void> {
  console.log('[Proactive Refresh] Initializing proactive refresh...');
  await startProactiveRefresh(dispatch, accessToken);
}

/**
 * Check if proactive refresh is active
 */
export function isProactiveRefreshActive(): boolean {
  return refreshTimer !== null;
}

