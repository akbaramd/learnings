// app/api/generatedClient.ts
import { NextRequest, NextResponse } from 'next/server';
import { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import nodeHttp from 'node:http';
import nodeHttps from 'node:https';
import { Api } from '@/src/services/Api';
import { cookies } from 'next/headers';
import { getServerEnvSync } from '@/src/config/env';

// Get UPSTREAM lazily to avoid errors during build
const getUpstream = () => getServerEnvSync().UPSTREAM_API_BASE_URL;

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
      if (cookie) config.headers['cookie'] = cookie;
      
      // Prioritize client's authorization header, fallback to server cookies
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
export function handleApiError(error: AxiosError | Error) {
  console.error('API Error:', error);
  
  // Handle AxiosError with response
  if ('response' in error && error.response) {
    const upstream = error.response;
    const setCookie = upstream.headers?.['set-cookie'];
    
    const res = NextResponse.json(
      { 
        error: error.message || 'Internal Server Error',
        status: upstream.status || 500 
      },
      { status: upstream.status || 500 }
    );
    
    // Forward Set-Cookie headers from upstream
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie);
      }
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
