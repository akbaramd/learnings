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
 * When a 401 is detected, dispatch setAnonymous() to trigger logout
 * Refresh token handling is done in generatedClient.ts (server-side)
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, unknown> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Check if we got a 401 error
  const got401 = (result?.error && 'status' in result.error && result.error.status === 401) || 
                 (result.meta?.response?.status === 401);
  
  // If we get a 401, clear user data and set anonymous to trigger logout
  // Refresh token handling is done server-side in generatedClient.ts
  // If refresh fails, we get 401 here and must logout
  if (got401) {
    api.dispatch(clearUser());
    api.dispatch(setAnonymous());
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});

