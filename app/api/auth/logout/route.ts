// app/api/auth/logout/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { LogoutResponse } from '@/src/store/auth/auth.types';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';
import { getServerEnvSync } from '@/src/config/env';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get access token from cookies
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    // If no tokens found, return success and clear any existing cookies
    if (!accessToken && !refreshToken) {
      const successResponse: LogoutResponse = {
        isSuccess: true,
        message: 'Already logged out',
        data: { isSuccess: true, message: 'Already logged out' }
      };
      
      const res = NextResponse.json(successResponse, { status: 200 });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      
      // Clear cookies anyway (in case they exist but weren't readable)
      res.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      
      res.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      
      return res;
    }
    
    // If no access token but refresh token exists, still proceed with logout
    if (!accessToken) {
      // Clear cookies and return success
      const successResponse: LogoutResponse = {
        isSuccess: true,
        message: 'Logged out successfully',
        data: { isSuccess: true, message: 'Logged out successfully' }
      };
      
      const res = NextResponse.json(successResponse, { status: 200 });
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      
      // Clear cookies
      res.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      
      res.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      
      return res;
    }

    // Parse request body to get refreshToken if provided
    let requestBody: { refreshToken?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // If no body provided, use empty object (refreshToken will be null)
      requestBody = {};
    }

    const upstreamBaseUrl = getServerEnvSync().UPSTREAM_API_BASE_URL;
    console.log('Logout API call details:', {
      baseURL: upstreamBaseUrl,
      hasAccessToken: !!accessToken,
      tokenLength: accessToken?.length,
      refreshToken: requestBody.refreshToken || 'null'
    });

    // فراخوانی متد logout upstream with proper request structure and authorization
    let upstream;
    let status = 200;
    
    try {
      upstream = await new Api({
        baseURL: upstreamBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      }).api.logout({
        refreshToken: requestBody.refreshToken || null
      }); 
      status = upstream.status ?? 200;
    } catch (apiError) {
      console.error('Upstream logout API failed:', {
        name: apiError instanceof Error ? apiError.name : 'Unknown',
        message: apiError instanceof Error ? apiError.message : String(apiError),
        baseURL: upstreamBaseUrl,
      });
      
      // If upstream API fails, still proceed with local logout
      upstream = {
        status: 200,
        data: { isSuccess: true, message: 'Local logout completed (upstream unavailable)' }
      };
      status = 200;
    }

    // Strongly typed response structure using ApplicationResult
    const response: LogoutResponse = {
      isSuccess: status === 200 && upstream.data?.isSuccess || false,
      message: upstream.data?.message || 'Logged out successfully',
      errors: upstream.data?.errors || undefined,
      data: {
        isSuccess: status === 200 && upstream.data?.isSuccess || false,
        message: upstream.data?.message || 'Logged out successfully'
      }
    };

    // Clear cookies only if logout API call was successful
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Only clear cookies if logout API call was successful
    if (status === 200 && upstream.data?.isSuccess) {
      // Clear access token cookie
      res.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
      
      // Clear refresh token cookie
      res.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
      });
    }

    return res;
  } catch (error) {
    console.error('[Logout] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    const errorResponse: LogoutResponse = {
      isSuccess: false,
      message: 'Failed to logout. Please try again.',
      errors: [error instanceof Error ? error.message : String(error)],
      data: { isSuccess: false, message: 'Logout failed' }
    };
    
    const result = NextResponse.json(errorResponse, { status: 400 });
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return result;
  }
}
