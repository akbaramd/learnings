import { 
  createApi, 
  fetchBaseQuery, 
  FetchArgs, 
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { setAnonymous } from '@/src/store/auth/auth.slice';
import { getCsrfHeader } from '@/src/lib/client-csrf';

// Single-flight refresh promise to prevent concurrent refresh requests
let refreshPromise: Promise<Response> | null = null;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  // Disable automatic retries - we handle retries manually for auth errors only
  fetchFn: fetch,
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    
    // Add CSRF token to headers - use headers.set() not Object.assign
    const csrfHeaders = getCsrfHeader();
    if (csrfHeaders['x-csrf-token']) {
      headers.set('x-csrf-token', csrfHeaders['x-csrf-token']);
    }
    
    return headers;
  },
});

/**
 * Check if the endpoint is the refresh endpoint
 * Uses exact matching to avoid false positives
 */
function isRefreshEndpoint(args: string | FetchArgs): boolean {
  const u = typeof args === 'string' ? args : args.url;
  if (!u) return false;
  const s = String(u);
  return s === '/auth/refresh' || s.startsWith('/auth/refresh?') || s.endsWith('/auth/refresh');
}

/**
 * Check if error is a network error (DNS failure, connection refused, etc.)
 * Network errors should NOT trigger token refresh - they should fail immediately
 */
function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  // Check for common network error codes
  if ('status' in error) {
    // RTK Query wraps network errors as status: 'FETCH_ERROR'
    if (error.status === 'FETCH_ERROR') return true;
  }
  
  // Check error message for network-related errors
  const errorMessage = 'message' in error ? String(error.message) : '';
  const networkErrorPatterns = [
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENETUNREACH',
    'ECONNRESET',
    'getaddrinfo',
    'Failed to fetch',
    'NetworkError',
  ];
  
  return networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // If we have a network error, return immediately without retrying or refreshing
  // Network errors indicate connectivity issues, not authentication problems
  if (result?.error && isNetworkError(result.error)) {
    // Don't try to refresh token on network errors - just return the error
    return result;
  }
  
  // Check if we got a 401 error (only HTTP 401, not network errors)
  const got401 = (result?.error && 'status' in result.error && result.error.status === 401) || 
                 (result.meta?.response?.status === 401);
  
  // If we get a 401 and the request wasn't to the refresh endpoint, try to refresh
  // ONLY retry for HTTP 401 errors, not network errors
  if (got401 && !isRefreshEndpoint(args)) {
    // Single-flight pattern: only create refresh request if one doesn't exist
    if (!refreshPromise) {
      refreshPromise = fetch('/api/auth/refresh', { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeader(),
        }
      });
    }
    
    try {
      const resp = await refreshPromise;

      // Check HTTP status first
      if (resp?.ok) {
        // Parse response body to check isSuccess field
        let refreshData;
        try {
          refreshData = await resp.json();
        } catch {
          // If JSON parsing fails, treat as failure
          console.warn('Failed to parse refresh token response');
          api.dispatch(setAnonymous());
          return { error: { status: 401, data: { errors: ['Session expired. Please login again.'] } } };
        }

        // Check if refresh was actually successful (not just HTTP 200)
        const isRefreshSuccessful = refreshData?.isSuccess === true && 
                                     refreshData?.data?.isSuccess === true;

        if (isRefreshSuccessful) {
          // Refresh successful - retry the original request (only once)
          return await rawBaseQuery(args, api, extraOptions);
        }

        // Refresh returned 200 but isSuccess is false (e.g., token binding validation failed)
        console.warn('Refresh token failed:', refreshData?.message || 'Unknown error', refreshData?.errors);
        api.dispatch(setAnonymous());
        return { error: { status: 401, data: { errors: [refreshData?.message || 'Session expired. Please login again.'] } } };
      }

      // HTTP status is not OK (401, 403, etc.) - refresh failed
      // Refresh failed - only update state, NO broadcast, NO redirect
      // Let useAuthGuard handle cross-tab sync and UI redirect
      api.dispatch(setAnonymous());
      return { error: { status: 401, data: { errors: ['Session expired. Please login again.'] } } };
    } catch (refreshError) {
      // Network error during refresh - don't retry, just fail immediately
      // Check if it's a network error
      if (isNetworkError(refreshError)) {
        // Network error during refresh - return immediately without retrying
        api.dispatch(setAnonymous());
        return { error: { status: 'FETCH_ERROR', data: { errors: ['Network error. Please check your connection.'] } } };
      }
      
      // Other errors during refresh
      api.dispatch(setAnonymous());
      return { error: { status: 401, data: { errors: ['Session expired'] } } };
    } finally {
      // Cleanup promise in ALL paths to prevent stuck state
      refreshPromise = null;
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

