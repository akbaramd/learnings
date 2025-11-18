import { 
  createApi, 
  fetchBaseQuery, 
  FetchArgs,
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { setAnonymous, clearUser, setInitialized, setErrorWithType } from '@/src/store/auth/auth.slice';
import { getCsrfHeader } from '@/src/lib/client-csrf';
import { getDeviceId } from '@/src/lib/deviceInfo';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  fetchFn: fetch,
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    
    // Add DeviceId header (required for session management)
    // DeviceId is stored in localStorage and persists across sessions
    if (typeof window !== 'undefined') {
      const deviceId = getDeviceId();
      if (deviceId) {
        headers.set('X-Device-Id', deviceId);
      }
    }
    
    // Add CSRF token to headers
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
 * IMPORTANT: Refresh token handling is done ENTIRELY server-side in generatedClient.ts
 * 
 * When a 401 is received:
 * 1. Server-side (generatedClient.ts) automatically attempts token refresh
 * 2. If refresh succeeds, the request is retried and returns 200 (client never sees 401)
 * 3. If refresh fails, server returns 401 with error message
 * 4. Client only receives 401 when refresh definitively failed - then we logout
 * 
 * This ensures clients never need to handle refresh tokens - it's all server-side
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Check if token was refreshed on server-side
  // Server adds 'x-token-refreshed' header after successful refresh
  // This means cookies were updated but Redux state needs to be synced
  // Headers can be Headers object (with .get()) or plain object
  const responseHeaders = result.meta?.response?.headers;
  const tokenWasRefreshed = 
    (responseHeaders instanceof Headers && responseHeaders.get('x-token-refreshed') === 'true') ||
    (responseHeaders && typeof responseHeaders === 'object' && 'x-token-refreshed' in responseHeaders && 
     String(responseHeaders['x-token-refreshed']) === 'true');

  if (tokenWasRefreshed) {
    console.log('[baseQueryWithReauth] Token was refreshed on server-side, syncing Redux state...');
    // Fetch user profile to sync Redux state with server-side session
    // This prevents "ghost logout" where cookies are valid but Redux shows anonymous
    // Use lazy import to avoid circular dependency (authApi uses baseQueryWithReauth)
    import('@/src/store/auth/auth.queries').then(({ authApi }) => {
      api.dispatch(authApi.endpoints.getMe.initiate());
      console.log('[baseQueryWithReauth] getMe initiated to sync Redux state');
    }).catch((error) => {
      console.error('[baseQueryWithReauth] Failed to import authApi:', error);
    });
  }
  
  // Check if we got a 401 error
  // This only happens when server-side refresh failed definitively
  // Check multiple ways the error might be structured:
  // 1. result.error.status === 401 (standard RTK Query error)
  // 2. result.meta?.response?.status === 401 (response metadata)
  // 3. result.data with status 401 (error response in data)
  const got401 = 
    (result?.error && 'status' in result.error && result.error.status === 401) || 
    (result.meta?.response?.status === 401) ||
    (result.data && typeof result.data === 'object' && 'status' in result.data && result.data.status === 401);

  // Check if we got a 403 Forbidden error (Session revoked)
  const got403 = 
    (result?.error && 'status' in result.error && result.error.status === 403) || 
    (result.meta?.response?.status === 403) ||
    (result.data && typeof result.data === 'object' && 'status' in result.data && result.data.status === 403);

  // Check for token refresh failure messages in the error response
  const isTokenRefreshFailure = result.data && typeof result.data === 'object' && 
    ('message' in result.data && 
     (String(result.data.message).includes('Token refresh failed') || 
      String(result.data.message).includes('Session expired')));

  // Check for Token Version Mismatch (logout-all-devices scenario)
  const isTokenVersionMismatch = result.data && typeof result.data === 'object' && 
    ('message' in result.data && 
     (String(result.data.message).toLowerCase().includes('token version mismatch') ||
      String(result.data.message).toLowerCase().includes('token_version') ||
      String(result.data.message).toLowerCase().includes('invalid token version')));

  // Check for explicit Session Expired message
  const isSessionExpired = result.data && typeof result.data === 'object' && 
    ('message' in result.data && 
     (String(result.data.message).toLowerCase().includes('session expired') ||
      String(result.data.message).toLowerCase().includes('session_expired') ||
      String(result.data.message).toLowerCase().includes('your session has expired')));

  // Handle 403 Forbidden (Session revoked)
  if (got403) {
    console.log('[baseQueryWithReauth] 403 Forbidden - Session revoked:', {
      error: result.error,
      data: result.data,
      meta: result.meta,
    });
    
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    api.dispatch(setErrorWithType({ 
      message: 'Session revoked. Please login again.', 
      type: 'session_revoked' 
    }));
    return result;
  }

  // Handle Token Version Mismatch (logout-all-devices)
  if (isTokenVersionMismatch) {
    console.log('[baseQueryWithReauth] Token version mismatch - logout all devices triggered:', {
      error: result.error,
      data: result.data,
      meta: result.meta,
    });
    
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    api.dispatch(setErrorWithType({ 
      message: 'You have been logged out from all devices. Please login again.', 
      type: 'token_version_mismatch' 
    }));
    return result;
  }

  // Handle explicit Session Expired
  if (isSessionExpired) {
    console.log('[baseQueryWithReauth] Session expired:', {
      error: result.error,
      data: result.data,
      meta: result.meta,
    });
    
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    api.dispatch(setErrorWithType({ 
      message: 'Your session has expired. Please login again.', 
      type: 'session_expired' 
    }));
    return result;
  }

  // If we get a 401 or token refresh failure, it means:
  // 1. Server tried to refresh token automatically
  // 2. Refresh failed (token expired, invalid, etc.)
  // 3. We must logout and clear user state
  // 
  // NOTE: We do NOT logout on network errors or other status codes
  // Only on definitive 401 after server-side refresh attempt failed
  if (got401 || isTokenRefreshFailure) {
    console.log('[baseQueryWithReauth] 401 or token refresh failure detected:', {
      got401,
      isTokenRefreshFailure,
      error: result.error,
      data: result.data,
      meta: result.meta,
    });
    
    // Clear user data and set anonymous to trigger logout
    // Also set initialized to true so isReady becomes true and layout can redirect
    console.log('[baseQueryWithReauth] Clearing user and setting anonymous...');
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    api.dispatch(setInitialized(true));
    console.log('[baseQueryWithReauth] User cleared, status set to anonymous, initialized set to true');
    console.log('[baseQueryWithReauth] Layout should detect authStatus change and redirect');
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});

