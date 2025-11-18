import { 
  createApi, 
  fetchBaseQuery, 
  FetchArgs,
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { setAnonymous, clearUser, setInitialized } from '@/src/store/auth/auth.slice';
import { getCsrfHeader } from '@/src/lib/client-csrf';
import { getDeviceId, getUserAgent } from '@/src/lib/deviceInfo';
import { signOut } from 'next-auth/react';
import { isAuthPage } from '@/src/lib/auth-utils';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  fetchFn: fetch,
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    
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
 * Base query with 401 handling
 * 
 * When a 401 is received:
 * 1. Clear Redux state
 * 2. Call NextAuth signOut to clear session
 * 3. Redirect to login page
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
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

  // Handle 401: Clear state, sign out, and redirect
  if (got401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
    
    // Don't redirect if already on auth page
      if (!isAuthPage(currentPath)) {
      // Clear Redux state first
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    
      // Call NextAuth signOut (no redirect, we handle it manually)
      // Note: CSRF error can occur but signOut still works - we ignore it
      // Then redirect to login with logout flag and return URL
      signOut({ redirect: false }).then(() => {
        // SignOut successful, redirect to login
        const encodedReturnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
      }).catch((error) => {
        // Even if signOut fails (e.g., CSRF error), we still redirect
        // The session will be cleared on next page load anyway
        if (process.env.NODE_ENV === 'development') {
          console.warn('[baseQueryWithReauth] signOut had an error (may be CSRF warning, continuing anyway):', error);
        }
        // Fallback: redirect anyway - session will be cleared on login page
        const encodedReturnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
      });
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

