// app/api/auth/refresh/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';
import { RefreshResponse } from '@/src/store/auth/auth.types';
import { ensureCsrfCookie, verifyCsrfFromRequest } from '@/src/lib/csrf';
import { getServerEnvSync } from '@/src/config/env';

export async function POST(req: NextRequest) {
  try {
    // Ensure CSRF protection
    const csrfRes = new NextResponse();
    ensureCsrfCookie(req, csrfRes);
    
    // Verify CSRF token
    const body = await req.json().catch(() => ({}));
    const isValid = verifyCsrfFromRequest(req, body.csrfToken);
    
    if (!isValid) {
      const errorResponse: RefreshResponse = {
        isSuccess: false,
        message: 'Invalid CSRF token',
        errors: ['Invalid CSRF token']
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }
    
    const api = new Api({
      baseURL: getServerEnvSync().UPSTREAM_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const cookieStore = await cookies();
    
    // Get refresh token from cookies
    const refreshToken = cookieStore.get('refreshToken')?.value;
 
    if (!refreshToken) {
      const errorResponse: RefreshResponse = {
        isSuccess: false,
        message: 'No refresh token found',
        errors: ['No refresh token found']
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }


    // فراخوانی متد refreshToken upstream
    const upstream = await api.api.refreshToken({ refreshToken }); 
    const upstreamStatus = upstream.status ?? 200;
    const upstreamIsSuccess = upstream.data?.isSuccess ?? false;

    // فوروارد کردن هر Set-Cookie جدید (در صورت rotation)
    const setCookie = upstream.headers?.['set-cookie'];

    // Strongly typed response structure using ApplicationResult
    const response: RefreshResponse = {
      isSuccess: upstreamIsSuccess,
      message: upstream.data?.message || (upstreamIsSuccess ? 'Token refreshed successfully' : 'Token refresh failed'),
      errors: upstream.data?.errors || undefined,
      data: upstreamIsSuccess && upstream.data?.data ? {
        isSuccess: true,
        message: upstream.data.message || 'Token refreshed successfully',
        accessToken: upstream.data.data?.accessToken || undefined
      } : undefined
    };

    // Return 401 if refresh failed (so client knows to stop retrying)
    // Return 200 only if refresh was actually successful
    const finalStatus = upstreamIsSuccess ? 200 : 401;
    const finalRes = NextResponse.json(response, { status: finalStatus });
    finalRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Update tokens in cookies ONLY if refresh was successful
    if (upstreamIsSuccess && upstream.data?.data) {
      const { accessToken, refreshToken: newRefreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Update access token in httpOnly cookie
        finalRes.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }
      
      if (newRefreshToken) {
        // Update refresh token in httpOnly cookie (token rotation)
        finalRes.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
    } else {
      // Clear tokens if refresh failed (token binding validation failed, expired, etc.)
      console.log('Refresh token failed, clearing auth cookies:', {
        upstreamStatus,
        upstreamIsSuccess,
        message: upstream.data?.message,
        errors: upstream.data?.errors,
      });
      
      // Clear access and refresh tokens
      finalRes.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
      });
      
      finalRes.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
      });
    }
    
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => finalRes.headers.append('set-cookie', c));
      else finalRes.headers.set('set-cookie', setCookie as string);
    }
    
    return finalRes;
  } catch (error) {
    console.error('Refresh BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    const errorResponse: RefreshResponse = {
      isSuccess: false,
      message: 'Failed to refresh token. Please try again.',
      errors: [error instanceof Error ? error.message : String(error)]
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }
}
