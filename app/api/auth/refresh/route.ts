// app/api/auth/refresh/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';
import { RefreshResponse } from '@/src/store/auth/auth.types';
import { ensureCsrfCookie, verifyCsrfFromRequest } from '@/src/lib/csrf';

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
    
    const baseURL = process.env.UPSTREAM_API_BASE_URL || 'https://auth.wa-nezam.org';
    
    const api = new Api({
      baseURL: baseURL,
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
    const status = upstream.status ?? 200;

    // فوروارد کردن هر Set-Cookie جدید (در صورت rotation)
    const setCookie = upstream.headers?.['set-cookie'];

    // Strongly typed response structure using ApplicationResult
    const response: RefreshResponse = {
      isSuccess: status === 200 && upstream.data?.isSuccess || false,
      message: upstream.data?.message || 'Token refreshed successfully',
      errors: upstream.data?.errors || undefined,
      data: status === 200 && upstream.data?.isSuccess ? {
        isSuccess: true,
        message: upstream.data.message || 'Token refreshed successfully',
        accessToken: upstream.data.data?.accessToken || undefined
      } : undefined
    };

    const finalRes = NextResponse.json(response, { status });
    finalRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Update tokens in cookies if refresh was successful
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
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
