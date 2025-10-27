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

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Check if we got a 401 error
  const got401 = (result?.error && 'status' in result.error && result.error.status === 401) || (result.meta?.response?.status === 401);
  
  // If we get a 401 and the request wasn't to the refresh endpoint, try to refresh
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

      if (resp?.ok) {
        // Refresh successful - retry the original request
        return await rawBaseQuery(args, api, extraOptions);
      }

      // Refresh failed - only update state, NO broadcast, NO redirect
      // Let useAuthGuard handle cross-tab sync and UI redirect
      api.dispatch(setAnonymous());
      return { error: { status: 401, data: { errors: ['Session expired. Please login again.'] } } };
    } catch {
      // Network error - only update state, NO broadcast, NO redirect
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

