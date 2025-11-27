import { NextRequest, NextResponse } from 'next/server';
import { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import { Api } from '@/src/services/Api';
import { getServerEnvSync } from '@/src/config/env';
import { getClientIp, getRequestUserAgent } from '@/src/lib/requestInfo';

// Get UPSTREAM lazily to avoid errors during build
const getUpstream = () => {
  const env = getServerEnvSync();
  if (!env.UPSTREAM_API_BASE_URL) {
    throw new Error('UPSTREAM_API_BASE_URL is not configured');
  }
  return env.UPSTREAM_API_BASE_URL;
};

// 🔥 REMOVED: Server-side refresh token handling
// Refresh token handling is now done ONLY in client-side (RTK Query baseQueryWithReauth)
// This simplifies the architecture and prevents duplicate refresh logic

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

  /**
   * 🔥 PRODUCTION-LEVEL: Get Access Token from Request Header
   * 
   * Architecture:
   * - Access Token is stored ONLY in Redux (client-side)
   * - Client sends accessToken in Authorization header via RTK Query prepareHeaders
   * - Route Handler (BFF) reads accessToken from request header
   * - Access Token is NEVER read from NextAuth session, localStorage, or cookies
   * 
   * Flow:
   * 1. Client (RTK Query) → prepareHeaders → Authorization: Bearer <token>
   * 2. Route Handler (BFF) → reads Authorization header
   * 3. Route Handler → forwards to upstream API with same header
   */
  const getAccessTokenFromHeader = (): string | null => {
    // 🔥 CRITICAL: Read accessToken from request Authorization header
    // Client sends it via RTK Query prepareHeaders
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      return token;
    }
    
    return null;
  };

  // Request interceptor: Add all required headers to every request
  http.interceptors.request.use(async (config) => {
    // Set content-type header
    config.headers['Content-Type'] = 'application/json';

    // 🔥 CRITICAL: Do NOT add Bearer token to auth endpoints that are used to GET the token
    // These endpoints should NOT have Authorization header:
    // - /api/v1/auth/otp (sendOtp - used to get token)
    // - /api/v1/auth/otp/verify (verifyOtp - used to get token)
    // - /api/v1/auth/refresh (refreshToken - uses refresh token from cookies, not Bearer)
    const url = config.url || '';
    const isAuthEndpoint = 
      url.includes('/api/v1/auth/otp') || // sendOtp or verifyOtp
      url.includes('/api/v1/auth/refresh'); // refreshToken
    
    // 🔥 STANDARD: Only add Bearer token if NOT an auth endpoint
    // Access Token comes from client request header (sent by RTK Query)
    if (!isAuthEndpoint) {
      const accessToken = getAccessTokenFromHeader();
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[API] ✅ Access token added to upstream request from client header');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[API] ⚠️ No access token in client request header');
        }
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

  /**
   * 🔥 PRODUCTION-LEVEL: Response Interceptor (NO Refresh Token Handling)
   * 
   * Architecture:
   * - Refresh Token handling is done ONLY in client-side (RTK Query baseQueryWithReauth)
   * - Route Handler (BFF) does NOT handle refresh - it just forwards 401 to client
   * - Client receives 401 → baseQueryWithReauth → refresh → retry
   * 
   * Flow:
   * 1. Upstream API returns 401
   * 2. Route Handler forwards 401 to client
   * 3. Client (RTK Query) detects 401 → baseQueryWithReauth
   * 4. Client refreshes token → retries request
   * 
   * Benefits:
   * - Single source of truth for refresh (client-side)
   * - No duplicate refresh logic
   * - Cleaner separation of concerns
   */
  http.interceptors.response.use(
    async (response) => response,
    async (error) => {
      // 🔥 CRITICAL: Do NOT handle 401 here - let client handle it
      // Client (RTK Query baseQueryWithReauth) will:
      // 1. Detect 401
      // 2. Call /api/auth/refresh (client-side)
      // 3. Update Redux accessToken
      // 4. Retry original request
      
      // Just forward the error to client
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
