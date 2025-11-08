import { 
  createApi, 
  fetchBaseQuery, 
  FetchArgs,
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { setAnonymous, clearUser } from '@/src/store/auth/auth.slice';
import { getCsrfHeader } from '@/src/lib/client-csrf';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  fetchFn: fetch,
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    
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

  // Also check for token refresh failure messages in the error response
  const isTokenRefreshFailure = result.data && typeof result.data === 'object' && 
    ('message' in result.data && 
     (String(result.data.message).includes('Token refresh failed') || 
      String(result.data.message).includes('Session expired')));

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
    console.log('[baseQueryWithReauth] Clearing user and setting anonymous...');
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
    console.log('[baseQueryWithReauth] User cleared, layout should redirect');
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});

