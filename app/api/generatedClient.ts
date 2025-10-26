// app/api/generatedClient.ts
import { NextRequest, NextResponse } from 'next/server';
import { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Api } from '@/src/services/Api';
import { createServerHttp } from '@/src/services/server/http';
import { cookies } from 'next/headers';

const UPSTREAM = process.env.UPSTREAM_API_BASE_URL 
  ?? 'https://auth.wa-nezam.org';

export function createApiForRequest(req: NextRequest) {
  const http = createServerHttp(UPSTREAM);

  // Get tokens from system cookies
  const getTokensFromSystem = async () => {
    try {
      const cookieStore = await cookies();
      
      return {
        accessToken: cookieStore.get('accessToken')?.value || null,
        refreshToken: cookieStore.get('refreshToken')?.value || null,
      };
    } catch (error) {
      console.error('Error getting tokens from system cookies:', error);
      return { accessToken: null, refreshToken: null };
    }
  };

  // Add authorization header if token exists
  const addAuthorizationHeader = async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getTokensFromSystem();
    
    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers['authorization'] = `Bearer ${accessToken}`;
    }
    
    return config;
  };

  // Handle 401 responses and redirect to login
  const handleUnauthorized = (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear tokens from cookies
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }
    return Promise.reject(error);
  };

  // Request interceptor - add authorization header
  http.interceptors.request.use(
    async (config) => {
      // Add authorization header if token exists
      config = await addAuthorizationHeader(config);
      
      // Forward client request headers to backend
      const cookie = req.headers.get('cookie');
      const auth = req.headers.get('authorization');

      config.headers = config.headers ?? {};
      if (cookie) config.headers['cookie'] = cookie;
      if (auth) config.headers['authorization'] = auth;

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

  // Response interceptor - handle 401 errors
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 unauthorized
      if (error.response?.status === 401) {
        // Try to refresh token if refresh token exists
        const { refreshToken } = await getTokensFromSystem();
        
        if (refreshToken) {
          // Attempt to refresh the token
          return http.post('/auth/refresh', { refreshToken })
            .then((refreshResponse) => {
              // Update the original request with new token
              const newAccessToken = refreshResponse.data.access_token;
              error.config.headers['authorization'] = `Bearer ${newAccessToken}`;
              
              // Retry the original request
              return http.request(error.config);
            })
            .catch((refreshError) => {
              // Refresh failed, redirect to login
              return handleUnauthorized(refreshError);
            });
        } else {
          // No refresh token, redirect to login
          return handleUnauthorized(error);
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
export function handleApiResponse(response: AxiosResponse, req: NextRequest) {
  if (response.status === 401) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.json(response.data, { 
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// Helper function to handle API errors in API routes
export function handleApiError(error: AxiosError | Error, req: NextRequest) {
  console.error('API Error:', error);
  
  // Handle AxiosError with 401
  if ('response' in error && error.response?.status === 401) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Handle AxiosError with response
  if ('response' in error) {
    return NextResponse.json(
      { 
        error: error.message || 'Internal Server Error',
        status: error.response?.status || 500 
      },
      { status: error.response?.status || 500 }
    );
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
