// app/api/auth/session/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';
import { SessionResponse } from '@/src/store/auth/auth.types';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get tokens from cookies
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    // If no tokens, user is not authenticated
    if (!accessToken && !refreshToken) {
      const response: SessionResponse = {
        result: { authenticated: false },
        errors: null
      };
      return NextResponse.json(response, { status: 200 });
    }

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://auth.wa-nezam.org';
    
    const api = new Api({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });

    // Only check if user can get their profile successfully
    const upstream = await api.api.getCurrentUser({}); 
    const status = upstream.status ?? 200;

    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      // User is authenticated and can get profile
      const response: SessionResponse = {
        result: { authenticated: true },
        errors: null
      };
      return NextResponse.json(response, { status: 200 });
    } else if (status === 401 && refreshToken) {
      // Access token expired but refresh token exists - try to refresh
      try {
        const refreshApi = new Api({
          baseURL: baseURL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
        });
        
        // Set Authorization header with refresh token
        const refreshUpstream = await refreshApi.api.refreshToken({ refreshToken });
        
        if (refreshUpstream.status === 200 && refreshUpstream.data?.isSuccess) {
          // Refresh successful, try getCurrentUser again with new access token
          const newAccessToken = refreshUpstream.data.data?.accessToken;
          if (newAccessToken) {
            api.instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            const retryUpstream = await api.api.getCurrentUser({});
            if (retryUpstream.status === 200 && retryUpstream.data?.isSuccess && retryUpstream.data?.data) {
              const response: SessionResponse = {
                result: { authenticated: true },
                errors: null
              };
              return NextResponse.json(response, { status: 200 });
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Refresh failed or user still not authenticated
      const response: SessionResponse = {
        result: { authenticated: false },
        errors: null
      };
      return NextResponse.json(response, { status: 200 });
    } else {
      // User cannot get profile - not authenticated
      const response: SessionResponse = {
        result: { authenticated: false },
        errors: null
      };
      return NextResponse.json(response, { status: 200 });
    }
  } catch (error) {
    console.error('Session BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    // In case of error, assume not authenticated
    const errorResponse: SessionResponse = {
      result: { authenticated: false },
      errors: [error instanceof Error ? error.message : String(error),'Session check failed. Please try again.']
    };
    return NextResponse.json(errorResponse, { status: 200 });
  }
}
