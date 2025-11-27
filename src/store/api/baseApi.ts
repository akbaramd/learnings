import { 
  createApi, 
  fetchBaseQuery, 
  FetchArgs,
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { setAnonymous, clearUser, setInitialized, setAccessToken } from '@/src/store/auth/auth.slice';
import { getCsrfHeader } from '@/src/lib/client-csrf';
import { getDeviceId, getUserAgent, fetchClientInfo, getCachedIpAddress } from '@/src/lib/deviceInfo';
import { signOut, getSession, signIn } from 'next-auth/react';
import { isAuthPage } from '@/src/lib/auth-utils';
import type { RootState } from '@/src/store/index';
/**
 * 🔥 PRODUCTION-LEVEL: Single-Flight Pattern for Token Refresh
 * 
 * Prevents multiple simultaneous refresh attempts (race condition)
 * Queues concurrent requests during refresh
 * 
 * Flow:
 * - If refresh is in progress → queue the request
 * - After refresh succeeds → retry all queued requests
 * - After refresh fails → fail all queued requests and logout
 */
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value: unknown) => void | Promise<void>;
  reject: (error: unknown) => void;
}> = [];

// 🔥 CRITICAL: Prevent infinite loop - track if we're retrying after refresh
// If retry after refresh also returns 401, we should logout, not refresh again
let isRetryingAfterRefresh = false;

/**
 * 🔥 PRODUCTION-LEVEL: Base Query with Access Token Management
 * 
 * Architecture:
 * - Access Token is stored in NextAuth session (server-side JWT)
 * - Access Token is read from NextAuth session in prepareHeaders
 * - Access Token is sent in Authorization header to backend
 * - Access Token is synced to Redux for backward compatibility
 * 
 * Flow:
 * 1. prepareHeaders reads accessToken from NextAuth session
 * 2. If accessToken exists → set Authorization header
 * 3. Backend validates accessToken
 * 4. If 401 → baseQueryWithReauth handles refresh
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  fetchFn: fetch,
  prepareHeaders: async (headers, { getState }) => {
    headers.set('content-type', 'application/json');
    
    // 🔥 CRITICAL: Read accessToken - Performance optimization
    // Strategy: Try Redux first (fast, synchronous), then NextAuth session (slower, async)
    // This reduces delay in prepareHeaders which is called for every request
    let accessToken: string | null = null;
    
    if (typeof window !== 'undefined') {
      // 🔥 PERFORMANCE: Check Redux first (synchronous, fast)
      // Redux is synced from NextAuth session after refresh/login
      const state = getState() as RootState;
      accessToken = state.auth?.accessToken || null;
      
      if (accessToken) {
        // Redux has accessToken - use it (fast path)
        headers.set('Authorization', `Bearer ${accessToken}`);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[baseApi] ✅ Access token from Redux added to Authorization header');
        }
      } else {
        // Redux doesn't have accessToken - try NextAuth session (slower, async)
        // This happens when Redux hasn't been synced yet
        try {
          const session = await getSession();
          accessToken = session?.accessToken || null;
          
          if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[baseApi] ✅ Access token from NextAuth session added to Authorization header');
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('[baseApi] ⚠️ No access token in Redux or NextAuth session');
            }
          }
        } catch (error) {
          console.error('[baseApi] Error getting NextAuth session:', error);
        }
      }
    } else {
      // Server-side: fallback to Redux state (shouldn't happen in client-side RTK Query)
      const state = getState() as RootState;
      accessToken = state.auth?.accessToken || null;
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }
    
    // Add device and client information headers (required for session management and tracking)
    // CRITICAL: Device ID must be synchronized across all requests
    // - Client-side: Uses getDeviceId() from localStorage (same device ID everywhere)
    // - Server-side: Receives device ID from X-Device-Id header (same device ID)
    // - Device ID is generated ONCE and NEVER regenerated (see deviceInfo.ts)
    if (typeof window !== 'undefined') {
      // Device ID header (required for session management)
      // CRITICAL: Always use getDeviceId() - it returns existing ID from localStorage
      // DeviceId is stored in localStorage and persists across sessions
      // Initialized by DeviceIdInitializer component at app startup
      // This ensures the SAME device ID is used in all client-side requests
      const deviceId = getDeviceId();
      if (deviceId && deviceId.startsWith('device-')) {
        // Only set header if device ID is valid (starts with 'device-')
        // This ensures we never send invalid or placeholder device IDs
        headers.set('X-Device-Id', deviceId);
      }
      
      // User Agent header (required for device identification and security)
      // CRITICAL: Always use getUserAgent() - consistent across all requests
      const userAgent = getUserAgent();
      if (userAgent && userAgent !== 'unknown') {
        headers.set('User-Agent', userAgent);
      }
    }
    
    // Add CSRF token to headers (required for POST/PUT/DELETE requests)
    const csrfHeaders = getCsrfHeader();
    if (csrfHeaders['x-csrf-token']) {
      headers.set('x-csrf-token', csrfHeaders['x-csrf-token']);
    }
    
    return headers;
  },
});

/**
 * 🔥 PRODUCTION-LEVEL: Base Query with 401 Handling and Queue Pattern
 * 
 * Architecture:
 * 1. Make original request
 * 2. If 401 received:
 *    a. Check if refresh is already in progress (Single-Flight Pattern)
 *    b. If refreshing → queue this request
 *    c. If not refreshing → start refresh, queue concurrent requests
 *    d. After refresh succeeds → retry all queued requests
 *    e. After refresh fails (401) → fail all queued requests, logout, redirect
 * 3. If server-side refresh detected → sync Redux state
 * 
 * Benefits:
 * - No duplicate refresh calls (Single-Flight)
 * - Concurrent requests are queued and retried together
 * - No race conditions
 * - Clean logout on refresh failure
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  // Make original request
  let result = await rawBaseQuery(args, api, extraOptions);
  
  // Check if token was refreshed on server-side
  const responseHeaders = result.meta?.response?.headers;
  const tokenWasRefreshed = 
    (responseHeaders instanceof Headers && responseHeaders.get('x-token-refreshed') === 'true') ||
    (responseHeaders && typeof responseHeaders === 'object' && 'x-token-refreshed' in responseHeaders && 
     String(responseHeaders['x-token-refreshed']) === 'true');

  if (tokenWasRefreshed) {
    // Sync Redux state with server-side session
    import('@/src/store/auth/auth.queries').then(({ authApi }) => {
      api.dispatch(authApi.endpoints.getMe.initiate());
    }).catch((error) => {
      console.error('[baseQueryWithReauth] Failed to sync state:', error);
    });
  }
  
  // Check if we got a 401 error
  const got401 = 
    (result?.error && 'status' in result.error && result.error.status === 401) || 
    (result.meta?.response?.status === 401) ||
    (result.data && typeof result.data === 'object' && 'status' in result.data && result.data.status === 401);

  // 🔥 CRITICAL: Prevent infinite loop
  // If we're retrying after refresh and still get 401, logout immediately
  if (got401 && isRetryingAfterRefresh && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[baseQueryWithReauth] ❌ Retry after refresh returned 401 - logging out to prevent infinite loop');
    }
    
    // Clear state and logout
    api.dispatch(clearUser());
    api.dispatch(setAccessToken(null));
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    
    signOut({ redirect: false }).then(() => {
      const encodedReturnUrl = encodeURIComponent(currentPath);
      window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
    }).catch(() => {
      const encodedReturnUrl = encodeURIComponent(currentPath);
      window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
    });
    
    isRetryingAfterRefresh = false;
    return result;
  }

  // Handle 401: Attempt client-side refresh with Queue Pattern
  if (got401 && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    
    // Don't attempt refresh if already on auth page
    if (isAuthPage(currentPath)) {
      return result;
    }

    // 🔥 SINGLE-FLIGHT PATTERN: If refresh is already in progress, queue this request
    if (isRefreshing) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[baseQueryWithReauth] 🔄 Refresh in progress, queuing request');
      }
      
      // Return a promise that will resolve/reject when refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: async (value: unknown) => {
            const token = value as string | null;
            if (!token) {
              // Refresh failed - return original 401 result
              resolve(result);
            } else {
              // Refresh succeeded - retry original request
              const retryResult = await rawBaseQuery(args, api, extraOptions);
              resolve(retryResult);
            }
          },
          reject: (error: unknown) => {
            reject(error);
          },
        });
      });
    }

    // 🔥 START REFRESH: Mark as refreshing and perform refresh
    isRefreshing = true;

    try {
      // Get device info
      let deviceId: string | null = null;
      let userAgent: string | null = null;
      let ipAddress: string | null = null;

      deviceId = getDeviceId();
      userAgent = getUserAgent();
      ipAddress = getCachedIpAddress();
      
      if (!ipAddress) {
        try {
          const clientInfo = await fetchClientInfo();
          ipAddress = clientInfo.ipAddress;
        } catch (error) {
          console.warn('[baseQueryWithReauth] Failed to fetch IP:', error);
        }
      }

      // 🔥 CRITICAL: Use NextAuth signIn('refresh') to refresh tokens
      // This calls the refresh provider which reads refreshToken from cookies
      // and updates the NextAuth session with new tokens
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
            // 🔥 REFRESH SUCCESS: Update accessToken in Redux and resolve all queued requests
            api.dispatch(setAccessToken(newAccessToken));
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[baseQueryWithReauth] ✅ Token refreshed via NextAuth, retrying original request and', refreshQueue.length, 'queued requests');
            }

            // 🔥 CRITICAL: Mark that we're retrying after refresh to prevent infinite loop
            isRetryingAfterRefresh = true;

            // Retry original request
            result = await rawBaseQuery(args, api, extraOptions);

            // 🔥 CRITICAL: Check if retry also returned 401
            const retryGot401 = 
              (result?.error && 'status' in result.error && result.error.status === 401) || 
              (result.meta?.response?.status === 401) ||
              (result.data && typeof result.data === 'object' && 'status' in result.data && result.data.status === 401);

            if (retryGot401) {
              // Retry after refresh also returned 401 - logout to prevent infinite loop
              if (process.env.NODE_ENV === 'development') {
                console.error('[baseQueryWithReauth] ❌ Retry after refresh returned 401 - accessToken may be invalid');
              }
              
              // Reject all queued requests
              refreshQueue.forEach(({ reject }) => reject(new Error('Retry after refresh returned 401')));
              refreshQueue = [];
              isRefreshing = false;
              isRetryingAfterRefresh = false;
              
              // Clear state and logout
              api.dispatch(clearUser());
              api.dispatch(setAccessToken(null));
              api.dispatch(setAnonymous());
              api.dispatch(setInitialized(true));
              
              signOut({ redirect: false }).then(() => {
                const encodedReturnUrl = encodeURIComponent(currentPath);
                window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
              }).catch(() => {
                const encodedReturnUrl = encodeURIComponent(currentPath);
                window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
              });
              
              return result;
            }

            // Retry succeeded - clear flag and resolve queued requests
            isRetryingAfterRefresh = false;

            // Resolve all queued requests (they will retry with new token)
            refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
            refreshQueue = [];
            isRefreshing = false;
        } else {
          // No accessToken in session after refresh
          throw new Error('Token refresh failed: No accessToken in session');
        }
      } else {
        // 🔥 REFRESH FAILED: Fail all queued requests and logout
        const errorMessage = refreshResult?.error || 'Token refresh failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      // 🔥 REFRESH FAILED: Reject all queued requests, logout, and redirect
      if (process.env.NODE_ENV === 'development') {
        console.log('[baseQueryWithReauth] ❌ Token refresh failed, logging out:', error);
      }

      // Reject all queued requests
      refreshQueue.forEach(({ reject }) => reject(error));
      refreshQueue = [];
      isRefreshing = false;
      isRetryingAfterRefresh = false; // Reset flag on error

      // Clear Redux state
      api.dispatch(clearUser());
      api.dispatch(setAccessToken(null));
      api.dispatch(setAnonymous());
      api.dispatch(setInitialized(true));
      
      // Call NextAuth signOut (no redirect, we handle it manually)
      signOut({ redirect: false }).then(() => {
        const encodedReturnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
      }).catch((signOutError) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[baseQueryWithReauth] signOut error (continuing anyway):', signOutError);
        }
        // Fallback: redirect anyway
        const encodedReturnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
      });

      // Return original 401 result
      return result;
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});

