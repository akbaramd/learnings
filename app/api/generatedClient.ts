// app/api/generatedClient.ts
import { NextRequest, NextResponse } from 'next/server';
import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import { Api } from '@/src/services/Api';
import { cookies } from 'next/headers';
import { getServerEnvSync } from '@/src/config/env';

// Get UPSTREAM lazily to avoid errors during build
const getUpstream = () => {
  const env = getServerEnvSync();
  if (!env.UPSTREAM_API_BASE_URL) {
    throw new Error('UPSTREAM_API_BASE_URL is not configured');
  }
  return env.UPSTREAM_API_BASE_URL;
};

// Global refresh promise to handle concurrent 401 requests
// Single-flight pattern: only one refresh request at a time
// This prevents multiple simultaneous refresh attempts
let globalRefreshPromise: Promise<{ success: boolean; accessToken?: string; refreshToken?: string }> | null = null;

// Lock flag to prevent race condition between checking and setting globalRefreshPromise
// CRITICAL: This ensures atomic check-and-set operation
let isRefreshing = false;

/**
 * Refresh access token using refresh token from cookies
 * Uses global promise to prevent concurrent refresh requests
 */
async function refreshAccessToken(req: NextRequest): Promise<{ success: boolean; accessToken?: string; refreshToken?: string }> {
  const isDev = process.env.NODE_ENV === 'development';
  
  // CRITICAL: Atomic check-and-set to prevent race condition
  // Pattern: Check lock, if locked wait, if not locked acquire lock immediately
  if (isRefreshing) {
    // Refresh is already in progress, wait for existing promise
    if (globalRefreshPromise) {
      if (isDev) {
        console.log('[RefreshToken] Refresh already in progress, waiting for concurrent request...');
      }
      try {
        const result = await globalRefreshPromise;
        if (isDev) {
          console.log('[RefreshToken] Concurrent request completed:', result.success ? 'SUCCESS' : 'FAILED');
        }
        return result;
      } catch (error) {
        if (isDev) {
          console.error('[RefreshToken] Concurrent request failed:', error);
        }
        return { success: false };
      }
    } else {
      // Lock is set but promise doesn't exist yet (shouldn't happen, but handle it)
      // Wait a bit and check again
      if (isDev) {
        console.warn('[RefreshToken] Lock set but promise missing, waiting...');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      if (globalRefreshPromise) {
        try {
          return await globalRefreshPromise;
        } catch {
          return { success: false };
        }
      }
    }
  }

  // Acquire lock BEFORE creating promise (prevents race condition)
  // This ensures only one refresh happens at a time
  isRefreshing = true;

  if (isDev) {
    console.log('[RefreshToken] Starting new refresh token request (lock acquired)...');
  }

  // Create new refresh promise
  globalRefreshPromise = (async () => {
    const isDevMode = process.env.NODE_ENV === 'development';
    try {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('refreshToken')?.value;

      if (!refreshToken) {
        if (isDevMode) {
          console.warn('[RefreshToken] No refresh token found in cookies');
        }
        return { success: false };
      }

      if (isDevMode) {
        console.log('[RefreshToken] Refresh token found, calling upstream API...', {
          refreshTokenLength: refreshToken.length,
          upstreamUrl: getUpstream(),
        });
      }

      // Create a temporary API instance for refresh call (without interceptors to avoid loop)
      const refreshHttp = axios.create({
        baseURL: getUpstream(),
        withCredentials: true,
        timeout: 20000,
        httpAgent: new nodeHttp.Agent({ keepAlive: true, maxSockets: 50 }),
        httpsAgent: new nodeHttps.Agent({ keepAlive: true, maxSockets: 50 }),
        validateStatus: () => true,
      });

      // Forward cookies from original request for refresh call
      const cookie = req.headers.get('cookie');
      if (cookie) {
        refreshHttp.defaults.headers.common['cookie'] = cookie;
      }
      
      // Also set cookie header for the refresh request
      refreshHttp.defaults.headers.common['Content-Type'] = 'application/json';

      // Extract device info from request
      const userAgent = req.headers.get('user-agent') || null;
      const forwardedFor = req.headers.get('x-forwarded-for');
      const ipAddress = forwardedFor 
        ? forwardedFor.split(',').map(ip => ip.trim())[0] 
        : req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || null;
      
      // Get deviceId from request body if available, or from cookies
      // Note: deviceId should be sent from client, but we can't get it here easily
      // The client should include it in the original request that triggered the refresh
      const deviceId = null; // Will be set by client in auth.queries.ts

      // Call upstream refresh endpoint with device info
      const refreshApi = new Api({});
      (refreshApi as unknown as { instance: AxiosInstance }).instance = refreshHttp;
      const response = await refreshApi.api.refreshToken({ 
        refreshToken,
        deviceId,
        userAgent,
        ipAddress,
      });
      
      if (isDevMode) {
        console.log('[RefreshToken] Upstream response status:', response.status);
        console.log('[RefreshToken] Upstream response data:', {
          isSuccess: response.data?.isSuccess,
          hasData: !!response.data?.data,
          hasAccessToken: !!response.data?.data?.accessToken,
          hasRefreshToken: !!response.data?.data?.refreshToken,
          message: response.data?.message,
          errors: response.data?.errors,
          fullData: response.data,
        });
      }
      
      // Check if refresh was successful
      const isSuccess = response.data?.isSuccess === true;
      const refreshData = response.data?.data;

      if (isSuccess && refreshData) {
        const newAccessToken = refreshData.accessToken ?? undefined;
        const newRefreshToken = refreshData.refreshToken ?? undefined;
        
        if (isDevMode) {
          console.log('[RefreshToken] Refresh successful, updating cookies...', {
            hasNewAccessToken: !!newAccessToken,
            hasNewRefreshToken: !!newRefreshToken,
            accessTokenLength: newAccessToken?.length,
            refreshTokenLength: newRefreshToken?.length,
          });
        }
        
        // Update tokens in cookies only if they are not null
        if (newAccessToken) {
          cookieStore.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
          });
          if (isDevMode) {
            console.log('[RefreshToken] Access token cookie updated');
          }
        }

        if (newRefreshToken) {
          cookieStore.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          if (isDevMode) {
            console.log('[RefreshToken] Refresh token cookie updated');
          }
        }

        if (isDevMode) {
          console.log('[RefreshToken] Token refresh completed successfully');
        }
        return { success: true, accessToken: newAccessToken, refreshToken: newRefreshToken };
      }

      // Refresh failed - clear tokens
      if (isDevMode) {
        console.warn('[RefreshToken] Refresh failed - clearing tokens', {
          status: response.status,
          isSuccess,
          hasData: !!refreshData,
          message: response.data?.message,
          errors: response.data?.errors,
          fullResponse: response.data,
        });
      }
      
      cookieStore.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      cookieStore.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });

      return { success: false };
    } catch (error) {
      if (isDevMode) {
        console.error('[RefreshToken] Refresh token error:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      return { success: false };
    } finally {
      // Clear promise and lock flag after completion
      if (isDevMode) {
        console.log('[RefreshToken] Clearing global refresh promise and lock');
      }
      globalRefreshPromise = null;
      isRefreshing = false; // CRITICAL: Release lock
    }
  })();

  return globalRefreshPromise;
}

/**
 * Check if the request is to the refresh endpoint
 */
function isRefreshEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  const urlStr = String(url);
  return urlStr.includes('/auth/refresh') || urlStr.includes('/refreshToken');
}

export function createApiForRequest(req: NextRequest) {
  const http = axios.create({
    baseURL: getUpstream(),
    withCredentials: true,
    timeout: 20000,
    httpAgent: new nodeHttp.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new nodeHttps.Agent({ keepAlive: true, maxSockets: 50 }),
    validateStatus: () => true,
  });

  // Get access token from system cookies
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const cookieStore = await cookies();
      return cookieStore.get('accessToken')?.value || null;
    } catch (error) {
      console.error('Error getting access token from cookies:', error);
      return null;
    }
  };

  // Request interceptor - add authorization header and forward tracing headers
  http.interceptors.request.use(
    async (config) => {
      // Forward client request headers to backend
      const cookie = req.headers.get('cookie');
      const clientAuth = req.headers.get('authorization');

      config.headers = config.headers ?? {};
      
      // Always forward cookies from client request
      if (cookie) {
        config.headers['cookie'] = cookie;
      }
      
      // Prioritize client's authorization header, fallback to server cookies
      // This allows client to override token if needed (e.g., for testing)
      if (clientAuth) {
        config.headers['authorization'] = clientAuth;
      } else {
        // Add authorization header from server cookies only if client didn't provide one
        const accessToken = await getAccessToken();
        if (accessToken) {
          config.headers['authorization'] = `Bearer ${accessToken}`;
        }
      }

      // Forward tracing headers
      const traceHeaders = ['x-request-id', 'x-correlation-id', 'x-forwarded-for', 'x-real-ip'];
      traceHeaders.forEach(h => {
        const v = req.headers.get(h);
        if (v) config.headers![h] = v;
      });

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle 401 responses/errors and refresh tokens
  // All concurrent 401 requests wait for the same refresh promise
  http.interceptors.response.use(
    async (response) => {
      const requestUrl = response.config?.url || 'unknown';
      const requestMethod = response.config?.method || 'unknown';
      const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle 401 responses (not just errors) - validateStatus: () => true means 401 is not an error
      if (response.status === 401 && !originalRequest._retry && !isRefreshEndpoint(requestUrl)) {
        const isDev = process.env.NODE_ENV === 'development';
        
        if (isDev) {
          console.log('[RefreshToken] 401 response detected in interceptor:', {
            url: requestUrl,
            method: requestMethod,
            isRetry: originalRequest._retry,
            isRefreshEndpoint: isRefreshEndpoint(requestUrl),
            responseData: response.data,
            responseHeaders: response.headers,
          });
        }

        originalRequest._retry = true;

        try {
          // All concurrent 401 requests wait for the same global refresh promise
          if (isDev) {
            console.log('[RefreshToken] Waiting for refresh token...');
          }
          const refreshResult = await refreshAccessToken(req);

          if (refreshResult.success && refreshResult.accessToken) {
            if (isDev) {
              console.log('[RefreshToken] Refresh successful, retrying original request:', {
                url: requestUrl,
                method: requestMethod,
                hasAccessToken: !!refreshResult.accessToken,
              });
            }

            // Get fresh cookies after refresh (they were updated in refreshAccessToken)
            const cookieStore = await cookies();
            const accessToken = cookieStore.get('accessToken')?.value;
            
            // Update authorization header with new token (prefer from cookie, fallback to refresh result)
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers['authorization'] = `Bearer ${accessToken || refreshResult.accessToken}`;
            
            // Update cookies in request for retry - get fresh cookie string
            const freshCookie = req.headers.get('cookie');
            if (freshCookie) {
              originalRequest.headers['cookie'] = freshCookie;
            }

            // Retry the original request with new token
            const retryResponse = await http.request(originalRequest);
            
            if (isDev) {
              console.log('[RefreshToken] Retry response:', {
                status: retryResponse.status,
                url: requestUrl,
                method: requestMethod,
                hasData: !!retryResponse.data,
              });
            }
            
            // Forward any new cookies from retry response
            const retrySetCookie = retryResponse.headers?.['set-cookie'];
            if (retrySetCookie) {
              // Update response headers to forward cookies
              if (Array.isArray(retrySetCookie)) {
                retrySetCookie.forEach(c => {
                  if (response.headers) {
                    response.headers['set-cookie'] = response.headers['set-cookie'] || [];
                    if (Array.isArray(response.headers['set-cookie'])) {
                      response.headers['set-cookie'].push(c);
                    }
                  }
                });
              }
            }
            
            // If retry returns 200, return 200; otherwise return the status from retry
            if (retryResponse.status === 200) {
              if (isDev) {
                console.log('[RefreshToken] Retry successful, returning 200 response');
              }
              // Add custom header to signal that token was refreshed
              // Client-side baseApi.ts will detect this and sync Redux state
              if (retryResponse.headers) {
                retryResponse.headers['x-token-refreshed'] = 'true';
              }
              return retryResponse;
            }
            
            // If retry still fails (shouldn't happen if refresh worked, but handle it)
            if (isDev) {
              console.warn('[RefreshToken] Retry failed with status:', retryResponse.status);
            }
            return retryResponse;
          }

          // Refresh failed or returned 401 - return 401 error with debug info in headers (dev only)
          const errorMessage = refreshResult.success === false 
            ? 'Token refresh failed - no new token received'
            : 'Token refresh failed - refresh token may be invalid';
          
          if (isDev) {
            console.error('[RefreshToken] Refresh failed, returning 401 error to client:', {
              refreshSuccess: refreshResult.success,
              hasAccessToken: !!refreshResult.accessToken,
              errorMessage,
            });
          }
          
          // Create a 401 error response
          const errorResponse = {
            ...response,
            status: 401,
            statusText: 'Unauthorized',
            data: {
              isSuccess: false,
              message: errorMessage,
              errors: ['Session expired. Please login again.']
            }
          };
          
          // In development, add debug info to response headers
          if (isDev) {
            errorResponse.headers = {
              ...errorResponse.headers,
              'x-debug-refresh-failed': 'true',
              'x-debug-refresh-success': String(refreshResult.success),
              'x-debug-has-access-token': String(!!refreshResult.accessToken),
              'x-debug-error-message': errorMessage,
            };
          }
          
          return Promise.reject({
            response: errorResponse,
            config: originalRequest,
            isAxiosError: true,
            message: errorMessage,
          } as AxiosError);
        } catch (refreshError) {
          const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
          
          if (isDev) {
            console.error('[RefreshToken] Error during refresh process:', {
              name: refreshError instanceof Error ? refreshError.name : 'Unknown',
              message: errorMessage,
              stack: refreshError instanceof Error ? refreshError.stack : undefined,
            });
          }
          
          // Create a 401 error response
          const errorResponse = {
            ...response,
            status: 401,
            statusText: 'Unauthorized',
            data: {
              isSuccess: false,
              message: `Token refresh error: ${errorMessage}`,
              errors: ['Session expired. Please login again.']
            }
          };
          
          // In development, add debug info to response headers
          if (isDev) {
            errorResponse.headers = {
              ...errorResponse.headers,
              'x-debug-refresh-error': 'true',
              'x-debug-error-name': refreshError instanceof Error ? refreshError.name : 'Unknown',
              'x-debug-error-message': errorMessage,
            };
          }
          
          return Promise.reject({
            response: errorResponse,
            config: originalRequest,
            isAxiosError: true,
            message: errorMessage,
          } as AxiosError);
        }
      }

      // If 200, return as-is
      if (response.status === 200) {
        return response;
      }
      
      // For other status codes, return as-is
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const requestUrl = originalRequest.url || 'unknown';
      const requestMethod = originalRequest.method || 'unknown';
      const isDev = process.env.NODE_ENV === 'development';

      // Only handle 401 errors, skip refresh endpoint to avoid infinite loop
      if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint(originalRequest.url)) {
        if (isDev) {
          console.log('[RefreshToken] 401 error detected in error handler:', {
            url: requestUrl,
            method: requestMethod,
            isRetry: originalRequest._retry,
            isRefreshEndpoint: isRefreshEndpoint(originalRequest.url),
            errorResponse: error.response?.data,
          });
        }

        originalRequest._retry = true;

        try {
          // All concurrent 401 requests wait for the same global refresh promise
          if (isDev) {
            console.log('[RefreshToken] Waiting for refresh token...');
          }
          const refreshResult = await refreshAccessToken(req);

          if (refreshResult.success && refreshResult.accessToken) {
            if (isDev) {
              console.log('[RefreshToken] Refresh successful, retrying original request:', {
                url: requestUrl,
                method: requestMethod,
                hasAccessToken: !!refreshResult.accessToken,
              });
            }

            // Get fresh cookies after refresh
            const cookieStore = await cookies();
            const accessToken = cookieStore.get('accessToken')?.value;
            
            // Update authorization header with new token (prefer from cookie, fallback to refresh result)
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers['authorization'] = `Bearer ${accessToken || refreshResult.accessToken}`;
            
            // Update cookies in request for retry - get fresh cookie string
            const freshCookie = req.headers.get('cookie');
            if (freshCookie) {
              originalRequest.headers['cookie'] = freshCookie;
            }

            // Retry the original request with new token
            const retryResponse = await http.request(originalRequest);
            
            if (isDev) {
              console.log('[RefreshToken] Retry response status:', retryResponse.status);
            }
            
            // Forward any new cookies from retry response
            const retrySetCookie = retryResponse.headers?.['set-cookie'];
            if (retrySetCookie) {
              // Update response headers to forward cookies
              if (Array.isArray(retrySetCookie)) {
                retrySetCookie.forEach(c => {
                  if (error.response?.headers) {
                    error.response.headers['set-cookie'] = error.response.headers['set-cookie'] || [];
                    if (Array.isArray(error.response.headers['set-cookie'])) {
                      error.response.headers['set-cookie'].push(c);
                    }
                  }
                });
              }
            }
            
            // If retry returns 200, return 200; otherwise return the status from retry
            if (retryResponse.status === 200) {
              if (isDev) {
                console.log('[RefreshToken] Retry successful, returning 200 response');
              }
              // Add custom header to signal that token was refreshed
              // Client-side baseApi.ts will detect this and sync Redux state
              if (retryResponse.headers) {
                retryResponse.headers['x-token-refreshed'] = 'true';
              }
              return retryResponse;
            }
            
            // If retry still fails (shouldn't happen if refresh worked, but handle it)
            if (isDev) {
              console.warn('[RefreshToken] Retry failed with status:', retryResponse.status);
            }
            return retryResponse;
          }

          // Refresh failed or returned 401 - return 401 error with debug info
          const errorMessage = refreshResult.success === false 
            ? 'Token refresh failed - no new token received'
            : 'Token refresh failed - refresh token may be invalid';
          
          if (isDev) {
            console.error('[RefreshToken] Refresh failed, returning 401 error to client:', {
              refreshSuccess: refreshResult.success,
              hasAccessToken: !!refreshResult.accessToken,
              errorMessage,
            });
          }
          
          // Create a 401 error response
          const errorResponse = {
            ...error.response,
            status: 401,
            statusText: 'Unauthorized',
            data: {
              isSuccess: false,
              message: errorMessage,
              errors: ['Session expired. Please login again.']
            },
            headers: {
              ...error.response?.headers,
              ...(isDev ? {
                'x-debug-refresh-failed': 'true',
                'x-debug-refresh-success': String(refreshResult.success),
                'x-debug-has-access-token': String(!!refreshResult.accessToken),
                'x-debug-error-message': errorMessage,
              } : {}),
            }
          };
          return Promise.reject({
            ...error,
            response: errorResponse
          });
        } catch (refreshError) {
          const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
          
          if (isDev) {
            console.error('[RefreshToken] Error during refresh process:', {
              name: refreshError instanceof Error ? refreshError.name : 'Unknown',
              message: errorMessage,
              stack: refreshError instanceof Error ? refreshError.stack : undefined,
            });
          }
          
          // Create a 401 error response
          const errorResponse = {
            ...error.response,
            status: 401,
            statusText: 'Unauthorized',
            data: {
              isSuccess: false,
              message: `Token refresh error: ${errorMessage}`,
              errors: ['Session expired. Please login again.']
            },
            headers: {
              ...error.response?.headers,
              ...(isDev ? {
                'x-debug-refresh-error': 'true',
                'x-debug-error-name': refreshError instanceof Error ? refreshError.name : 'Unknown',
                'x-debug-error-message': errorMessage,
              } : {}),
            }
          };
          return Promise.reject({
            ...error,
            response: errorResponse
          });
        }
      }

      // For all other errors (non-401), return as-is with original status
      if (error.response?.status !== 401) {
        if (isDev) {
          console.log('[RefreshToken] Non-401 error, returning as-is:', {
            status: error.response?.status,
            url: requestUrl,
            method: requestMethod,
          });
        }
      }
      return Promise.reject(error);
    }
  );

  const api = new Api({});
  (api as unknown as { instance: AxiosInstance }).instance = http;
  return api;
}

// Helper function to create API instance for API routes
export function createApiInstance(req: NextRequest) {
  return createApiForRequest(req);
}

// Helper function to handle API responses in API routes
export function handleApiResponse(response: AxiosResponse) {
  // Forward Set-Cookie headers from upstream if present
  const setCookie = response.headers?.['set-cookie'];
  const res = NextResponse.json(response.data, { 
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  // Forward Set-Cookie headers
  if (setCookie) {
    if (Array.isArray(setCookie)) {
      setCookie.forEach(c => res.headers.append('set-cookie', c));
    } else {
      res.headers.set('set-cookie', setCookie);
    }
  }
  
  return res;
}

// Helper function to handle API errors in API routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleApiError(error: AxiosError | Error, _req?: NextRequest) {
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
  
  // Handle AxiosError with response
  if ('response' in error && error.response) {
    const upstream = error.response;
    const setCookie = upstream.headers?.['set-cookie'];
    const status = upstream.status || 500;
    
    // API routes should return JSON responses, not redirects
    // Client-side code (RTK Query) will handle 401s and redirect if needed
    // This ensures API routes work correctly when called directly or via fetch/axios
    
    // Extract error message from response data if available
    let errorMessage = error.message || 'Internal Server Error';
    let errorData = upstream.data;
    
    if (upstream.data && typeof upstream.data === 'object') {
      const data = upstream.data as Record<string, unknown>;
      if (data.message && typeof data.message === 'string') {
        errorMessage = data.message;
      }
      errorData = data;
    }
    
    const res = NextResponse.json(
      { 
        error: errorMessage,
        status,
        ...(errorData && typeof errorData === 'object' ? errorData : {}),
      },
      { status }
    );
    
    // Forward Set-Cookie headers from upstream
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie);
      }
    }
    
    // In development, forward debug headers from upstream
    if (isDev) {
      const debugHeaders = [
        'x-debug-refresh-failed',
        'x-debug-refresh-success',
        'x-debug-has-access-token',
        'x-debug-error-message',
        'x-debug-refresh-error',
        'x-debug-error-name',
      ];
      
      debugHeaders.forEach(header => {
        const value = upstream.headers?.[header];
        if (value) {
          res.headers.set(header, String(value));
        }
      });
    }
    
    return res;
  }
  
  // Handle regular Error
  return NextResponse.json(
    { 
      error: error.message || 'Internal Server Error',
      status: 500 
    },
    { status: 500 }
  );
}
