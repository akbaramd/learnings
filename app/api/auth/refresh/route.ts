// app/api/auth/refresh/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';
import { RefreshResponse } from '@/src/store/auth/auth.types';

export async function POST(req: NextRequest) {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://auth.wa-nezam.org';
    
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
        result: null,
        errors: ['No refresh token found']
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Set Authorization header with refresh token
    api.instance.defaults.headers.common['Authorization'] = `Bearer ${refreshToken}`;

    // فراخوانی متد refreshToken upstream
    const upstream = await api.api.refreshToken({ refreshToken }); 
    const status = upstream.status ?? 200;

    // فوروارد کردن هر Set-Cookie جدید (در صورت rotation)
    const setCookie = upstream.headers?.['set-cookie'];

    // Strongly typed response structure
    const response: RefreshResponse = {
      result: status === 200 && upstream.data?.isSuccess ? {
        isSuccess: true,
        message: upstream.data.message || 'Token refreshed successfully',
        accessToken: upstream.data.data?.accessToken || undefined
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Token refresh failed'] : []
    };

    const res = NextResponse.json(response, { status });
    
    // Update tokens in cookies if refresh was successful
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken: newRefreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Update access token in httpOnly cookie
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }
      
      if (newRefreshToken) {
        // Update refresh token in httpOnly cookie (token rotation)
        res.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
    }
    
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }
    
    return res;
  } catch (error) {
    console.error('Refresh BFF error:', error);
    const errorResponse: RefreshResponse = {
      result: null,
      errors: ['Internal server error']
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
