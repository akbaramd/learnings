import { NextRequest, NextResponse } from 'next/server';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import { Api } from '@/src/services/Api';
import { getServerEnvSync } from '@/src/config/env';
import { auth } from '@/src/lib/auth';
import { getClientIp, getRequestUserAgent } from '@/src/lib/requestInfo';

// Get UPSTREAM lazily to avoid errors during build
const getUpstream = () => {
  const env = getServerEnvSync();
  if (!env.UPSTREAM_API_BASE_URL) {
    throw new Error('UPSTREAM_API_BASE_URL is not configured');
  }
  return env.UPSTREAM_API_BASE_URL;
};

// Per-request refresh promise map to handle concurrent 401 requests
// Key: request identifier (host + deviceId), Value: { promise, createdAt, timeoutId }
// This prevents memory leaks by cleaning up promises after use
interface RefreshPromiseEntry {
  promise: Promise<{ success: boolean; accessToken?: string; refreshToken?: string }>;
  createdAt: number;
  timeoutId?: NodeJS.Timeout;
}

const refreshPromises = new Map<string, RefreshPromiseEntry>();
const MAX_REFRESH_RETRIES = 1; // Prevent infinite retry loops
const PROMISE_MAX_AGE = 60000; // 60 seconds - maximum age for a promise
const PROMISE_TIMEOUT = 30000; // 30 seconds - timeout for individual promises
const CLEANUP_INTERVAL = 30000; // 30 seconds - periodic cleanup interval

// Periodic cleanup of stale promises
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup if not already running
 * This ensures stale promises are removed even if immediate cleanup fails
 */
function startPeriodicCleanup() {
  if (cleanupIntervalId) return; // Already running
  
  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    const staleKeys: string[] = [];
    
    for (const [key, entry] of refreshPromises.entries()) {
      const age = now - entry.createdAt;
      if (age > PROMISE_MAX_AGE) {
        staleKeys.push(key);
        // Clear timeout if exists
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
      }
    }
    
    if (staleKeys.length > 0) {
      const isDevMode = process.env.NODE_ENV === 'development';
      if (isDevMode) {
        console.warn(`[RefreshToken] Cleaning up ${staleKeys.length} stale promises`);
      }
      staleKeys.forEach(key => refreshPromises.delete(key));
    }
    
    // If map is empty, stop periodic cleanup
    if (refreshPromises.size === 0 && cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
  }, CLEANUP_INTERVAL);
}

// CRITICAL: Shared HTTP agents to prevent memory leaks
// Creating new agents for each request causes memory accumulation
// Shared agents with limited connections prevent excessive memory usage
const sharedHttpAgent = new nodeHttp.Agent({ 
  keepAlive: true, 
  maxSockets: 10, // Reduced from 50 to prevent memory issues
  maxFreeSockets: 2,
  timeout: 60000,
  scheduling: 'fifo' as const,
});

const sharedHttpsAgent = new nodeHttps.Agent({ 
  keepAlive: true, 
  maxSockets: 10, // Reduced from 50 to prevent memory issues
  maxFreeSockets: 2,
  timeout: 60000,
  scheduling: 'fifo' as const,
});

/**
 * Get unique key for refresh promise (prevents multiple refresh attempts for same request)
 * CRITICAL: Uses device ID from request headers (sent by client)
 * This ensures the same device ID is used for refresh promise deduplication
 */
function getRefreshKey(req: NextRequest): string {
  const host = req.headers.get('host') || 'unknown';
  // CRITICAL: Device ID comes from client request headers
  // Client sends device ID from localStorage via baseApi.ts
  // This ensures the SAME device ID is used across all server-side requests
  const deviceId = req.headers.get('x-device-id') || 'unknown';
  return `${host}:${deviceId}`;
}

/**
 * Clean up refresh promise immediately after resolution
 * CRITICAL: Immediate cleanup prevents memory leaks
 */
function cleanupRefreshPromise(key: string) {
  const entry = refreshPromises.get(key);
  if (entry) {
    // Clear timeout if exists
    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId);
    }
    // Remove from map immediately
    refreshPromises.delete(key);
  }
  
  // Emergency cleanup if map grows too large
  if (refreshPromises.size > 100) {
    const isDevMode = process.env.NODE_ENV === 'development';
    if (isDevMode) {
      console.warn('[RefreshToken] Refresh promises map too large, performing emergency cleanup');
    }
    // Delete oldest entries (first 50)
    const entries = Array.from(refreshPromises.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    for (let i = 0; i < Math.min(50, entries.length); i++) {
      const [key, entry] = entries[i];
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      refreshPromises.delete(key);
    }
  }
}

/**
 * Refresh access token using refresh token from cookies
 * This function calls /api/auth/refresh endpoint (BFF) instead of directly calling upstream
 * 
 * CRITICAL FIXES:
 * 1. Per-request refresh promises (prevents memory leaks)
 * 2. Proper cleanup of axios instances
 * 3. All headers included in refresh request
 * 4. Retry limit to prevent infinite loops
 */
async function refreshAccessToken(req: NextRequest): Promise<{ success: boolean; accessToken?: string; refreshToken?: string }> {
  const refreshKey = getRefreshKey(req);
  const isDevMode = process.env.NODE_ENV === 'development';

  // Check if refresh is already in progress for this request
  const existingEntry = refreshPromises.get(refreshKey);
  if (existingEntry) {
    // Check if promise is too old (stale)
    const age = Date.now() - existingEntry.createdAt;
    if (age > PROMISE_MAX_AGE) {
      // Promise is stale, remove it and create a new one
      if (existingEntry.timeoutId) {
        clearTimeout(existingEntry.timeoutId);
      }
      refreshPromises.delete(refreshKey);
    } else {
      // Use existing promise
      try {
        const result = await existingEntry.promise;
        return result;
      } catch {
        // If existing promise failed, create a new one
        cleanupRefreshPromise(refreshKey);
      }
    }
  }

  // Create new refresh promise with timeout protection
  const createdAt = Date.now();
  let timeoutId: NodeJS.Timeout | undefined;
  
  const refreshPromise = Promise.race([
    (async (): Promise<{ success: boolean; accessToken?: string; refreshToken?: string }> => {
      let refreshHttp: ReturnType<typeof axios.create> | null = null;
      
      try {
      // Get the session using custom auth function
      const session = await auth(req);

      if (!session || !session.accessToken || !session.refreshToken) {
        if (isDevMode) {
          console.log('[RefreshToken] No session or tokens found - user logged out, skipping refresh attempt');
        }
        return { success: false };
      }

      // CRITICAL: Call BFF endpoint /api/auth/refresh instead of directly calling upstream
      // Build the BFF refresh endpoint URL
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const refreshUrl = `${protocol}://${host}/api/auth/refresh`;

      // Extract device info from request headers (CRITICAL: Must include all headers)
      // CRITICAL: Device ID comes from client request headers (sent by baseApi.ts)
      // This ensures the SAME device ID from client localStorage is used in refresh request
      // Device ID is NEVER generated here - always comes from client
      const deviceId = req.headers.get('x-device-id') || null;
      const userAgent = getRequestUserAgent(req);
      const ipAddress = getClientIp(req);
      
      // Validate device ID format
      const isValidDeviceId = deviceId && deviceId.startsWith('device-') && deviceId.length > 7;

      // Forward cookies from original request
      const cookie = req.headers.get('cookie');

      // Prepare request body for BFF endpoint
      // NOTE: refreshToken is NOT sent in body - it's read from cookies by BFF endpoint
      const refreshRequestBody = {
        deviceId: deviceId,
        userAgent: userAgent,
        ipAddress: ipAddress,
      };

      // Create HTTP client for calling BFF endpoint
      // CRITICAL: Store reference for cleanup
      // Use dedicated agents for refresh requests (no keepAlive to prevent leaks)
      refreshHttp = axios.create({
        baseURL: refreshUrl,
        withCredentials: true,
        timeout: 30000, // Reduced timeout to prevent hanging
        validateStatus: () => true,
        // CRITICAL: Use agents without keepAlive for refresh requests
        // This ensures connections are closed immediately after use
        httpAgent: new nodeHttp.Agent({ 
          keepAlive: false, 
          maxSockets: 1,
          timeout: 30000,
        }),
        httpsAgent: new nodeHttps.Agent({ 
          keepAlive: false, 
          maxSockets: 1,
          timeout: 30000,
        }),
      });
      
      // Set headers properly
      if (cookie) {
        refreshHttp.defaults.headers.common['cookie'] = cookie;
      }
      refreshHttp.defaults.headers.common['Content-Type'] = 'application/json';
      
      // CRITICAL: Include all required headers in refresh request
      // Only use valid device IDs (must start with 'device-')
      // This ensures the SAME device ID from client is used in refresh
      if (isValidDeviceId) {
        refreshHttp.defaults.headers.common['X-Device-Id'] = deviceId;
      } else if (deviceId) {
        if (isDevMode) {
          console.warn('[RefreshToken] Invalid device ID format, skipping header:', deviceId);
        }
      }
      if (userAgent) {
        refreshHttp.defaults.headers.common['User-Agent'] = userAgent;
      }
      if (ipAddress) {
        refreshHttp.defaults.headers.common['X-Real-Ip'] = ipAddress;
      }
      
      // Call BFF refresh endpoint
      const response = await refreshHttp.post('', refreshRequestBody);
      
      // Check if refresh was successful
      const isSuccess = response.status === 200 && response.data?.isSuccess === true;
      const refreshData = response.data?.data;

      if (isSuccess && refreshData) {
        const newAccessToken = refreshData.accessToken ?? undefined;
        const newRefreshToken = refreshData.refreshToken ?? undefined;
        
        if (newAccessToken && newRefreshToken) {
          if (isDevMode) {
            console.log('[RefreshToken] ✅ Refresh successful via BFF');
          }
          return { success: true, accessToken: newAccessToken, refreshToken: newRefreshToken };
        }
      }

      if (isDevMode) {
        console.error('[RefreshToken] ❌ Refresh failed via BFF', {
          status: response.status,
          isSuccess,
          message: response.data?.message,
        });
      }

      return { success: false };
    } catch (error) {
      if (isDevMode) {
        console.error('[RefreshToken] Error refreshing token:', error);
      }
      return { success: false };
    } finally {
        // CRITICAL: Clean up axios instance to prevent memory leaks
        if (refreshHttp) {
          try {
            // Cancel any pending requests
            refreshHttp.interceptors.request.clear();
            refreshHttp.interceptors.response.clear();
            
            // CRITICAL: Destroy HTTP agents to free memory
            // This ensures all internal resources are released
            if (refreshHttp.defaults.httpAgent) {
              try {
                (refreshHttp.defaults.httpAgent as nodeHttp.Agent).destroy();
              } catch {
                // Ignore errors during agent destruction
              }
            }
            if (refreshHttp.defaults.httpsAgent) {
              try {
                (refreshHttp.defaults.httpsAgent as nodeHttps.Agent).destroy();
              } catch {
                // Ignore errors during agent destruction
              }
            }
          } catch (cleanupError) {
            if (isDevMode) {
              console.warn('[RefreshToken] Error cleaning up axios instance:', cleanupError);
            }
          }
        }
      }
    })(),
    // Timeout promise - rejects if refresh takes too long
    new Promise<{ success: boolean; accessToken?: string; refreshToken?: string }>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (isDevMode) {
          console.warn('[RefreshToken] Refresh promise timeout after', PROMISE_TIMEOUT, 'ms');
        }
        reject(new Error('Refresh token timeout'));
      }, PROMISE_TIMEOUT);
    }),
  ]).catch((error) => {
    // Handle timeout or other errors - return failure instead of rejecting
    if (isDevMode && error instanceof Error && error.message === 'Refresh token timeout') {
      console.warn('[RefreshToken] Refresh timed out, returning failure');
    }
    return { success: false };
  }).finally(() => {
    // CRITICAL: Clean up timeout and promise from map immediately after resolution
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    cleanupRefreshPromise(refreshKey);
  }) as Promise<{ success: boolean; accessToken?: string; refreshToken?: string }>;

  // Store promise in map with metadata
  refreshPromises.set(refreshKey, {
    promise: refreshPromise,
    createdAt,
    timeoutId,
  });

  // Start periodic cleanup if not already running
  startPeriodicCleanup();

  return refreshPromise;
}

export function createApiInstance(req: NextRequest) {
  // Extract headers from request (device ID, user agent, IP address)
  // CRITICAL: Device ID synchronization
  // - Client-side (baseApi.ts): Uses getDeviceId() from localStorage → sends in X-Device-Id header
  // - Server-side (here): Receives device ID from X-Device-Id header → forwards to upstream API
  // - This ensures the SAME device ID is used across all requests (client → server → upstream)
  // - Device ID is NEVER generated on server-side - always comes from client
  const deviceId = req.headers.get('x-device-id') || null;
  const userAgent = getRequestUserAgent(req);
  const ipAddress = getClientIp(req);
  
  // Validate device ID format (must start with 'device-')
  // This ensures we only use valid device IDs from client
  const isValidDeviceId = deviceId && deviceId.startsWith('device-') && deviceId.length > 7;

  // Create axios instance with interceptors
  // CRITICAL: Use shared HTTP agents to prevent memory leaks
  // Creating new agents for each request causes memory accumulation
  const http = axios.create({
    baseURL: getUpstream(),
    withCredentials: true,
    timeout: 60000,
    // CRITICAL: Use shared agents instead of creating new ones
    // This prevents memory leaks from accumulating HTTP agents
    httpAgent: sharedHttpAgent,
    httpsAgent: sharedHttpsAgent,
    validateStatus: () => true,
  });

  // Get access token from NextAuth session
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const session = await auth(req);
      return session?.accessToken || null;
    } catch (error) {
      console.error('Error getting access token from session:', error);
      return null;
    }
  };

  // Request interceptor: Add all required headers to every request
  http.interceptors.request.use(async (config) => {
    // Set content-type header
    config.headers['Content-Type'] = 'application/json';

    // CRITICAL: Do NOT add Bearer token to auth endpoints that are used to GET the token
    // These endpoints should NOT have Authorization header:
    // - /api/v1/auth/otp (sendOtp - used to get token)
    // - /api/v1/auth/otp/verify (verifyOtp - used to get token)
    // - /api/v1/auth/refresh (refreshToken - uses refresh token from cookies, not Bearer)
    const url = config.url || '';
    const isAuthEndpoint = 
      url.includes('/api/v1/auth/otp') || // sendOtp or verifyOtp
      url.includes('/api/v1/auth/refresh'); // refreshToken
    
    // Only add Bearer token if NOT an auth endpoint
    if (!isAuthEndpoint) {
      const accessToken = await getAccessToken();
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    // Add device ID header (from client request)
    // CRITICAL: Only use valid device IDs from client
    // This ensures the SAME device ID from client localStorage is forwarded to upstream API
    // Device ID is NEVER generated here - always comes from client via headers
    if (isValidDeviceId) {
      config.headers['X-Device-Id'] = deviceId;
    } else if (deviceId) {
      // Log warning if device ID is present but invalid format
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API] Invalid device ID format received from client:', deviceId);
      }
    }

    // Add user agent header (from client request)
    // This is required for device identification and security
    if (userAgent) {
      config.headers['User-Agent'] = userAgent;
    }

    // Add IP address header (extracted from request)
    // This is used for security and session tracking
    if (ipAddress) {
      config.headers['X-Real-Ip'] = ipAddress;
    }

    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  // Response interceptor: Handle 401 errors and refresh tokens
  // CRITICAL: Add retry limit to prevent infinite loops
  http.interceptors.response.use(
    async (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { 
        _retry?: boolean;
        _retryCount?: number;
      };
      
      // Only handle 401 errors and prevent infinite retry loops
      if (error.response?.status === 401 && !originalRequest._retry) {
        const retryCount = (originalRequest._retryCount || 0) + 1;
        
        // CRITICAL: Prevent infinite retry loops
        if (retryCount > MAX_REFRESH_RETRIES) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[API] Max refresh retries exceeded, rejecting request');
          }
          return Promise.reject(error);
        }
        
        originalRequest._retry = true;
        originalRequest._retryCount = retryCount;
        
        try {
          const refreshResult = await refreshAccessToken(req);

          if (refreshResult.success && refreshResult.accessToken) {
            // Update authorization header with new token
            originalRequest.headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
            
            // CRITICAL: Also ensure device ID and other headers are still present after retry
            // Use the same device ID from original request (synchronized with client)
            if (isValidDeviceId) {
              originalRequest.headers['X-Device-Id'] = deviceId;
            }
            if (userAgent) {
              originalRequest.headers['User-Agent'] = userAgent;
            }
            if (ipAddress) {
              originalRequest.headers['X-Real-Ip'] = ipAddress;
            }
            
            // Retry the original request with the new access token
            return http(originalRequest);
          }
        } catch (refreshError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[API] Error during token refresh:', refreshError);
          }
          // If refresh fails, reject the original error
          return Promise.reject(error);
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Create Api instance and replace its axios instance with our configured one
  const api = new Api({
    baseURL: getUpstream(),
    withCredentials: true,
    timeout: 60000,
  });

  // Replace the Api instance's axios instance with our configured one
  api.instance = http;

  return api;
}

export function handleApiResponse(response: AxiosResponse) {
  const setCookie = response.headers?.['set-cookie'];
  const res = NextResponse.json(response.data, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  
  if (setCookie) {
    if (Array.isArray(setCookie)) {
      setCookie.forEach(c => res.headers.append('set-cookie', c));
    } else {
      res.headers.set('set-cookie', setCookie);
    }
  }
  
  return res;
}

export function handleApiError(error: AxiosError | Error) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.error('[API Error] Full error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      isAxiosError: 'response' in error,
      responseStatus: 'response' in error && error.response ? error.response.status : undefined,
      responseData: 'response' in error && error.response ? error.response.data : undefined,
    });
  } else {
    console.error('API Error:', error);
  }
  
  if ('response' in error && error.response) {
    const upstream = error.response;
    const setCookie = upstream.headers?.['set-cookie'];
    const status = upstream.status || 500;
    
    let errorMessage = error.message || 'Internal Server Error';
    let errorData = upstream.data;
    
    if (upstream.data && typeof upstream.data === 'object') {
      const data = upstream.data as Record<string, unknown>;
      if (data.message && typeof data.message === 'string') {
        errorMessage = data.message;
      }
      errorData = data;
    }
    
    const res = NextResponse.json({ error: errorMessage, status, ...(errorData && typeof errorData === 'object' ? errorData : {}) }, { status });
    
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie);
      }
    }
    
    return res;
  }
  
  return NextResponse.json({ error: error.message || 'Internal Server Error', status: 500 }, { status: 500 });
}
