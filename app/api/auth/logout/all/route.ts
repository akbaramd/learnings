// app/api/auth/logout/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { LogoutResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * POST /api/auth/logout/all
 * Logout from all sessions
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    
    // Call upstream API - empty body for logout all
    const upstream = await api.api.logoutAllSessions({}, {});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T>
    const response: LogoutResponse = {
      isSuccess: !!upstream.data?.data?.isSuccess,
      message: upstream.data?.message || 'Logged out from all sessions successfully',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || {
        isSuccess: !!upstream.data?.data?.isSuccess,
        message: upstream.data?.message || 'Logged out from all sessions successfully'
      }
    };

    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    // Forward upstream cookies
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    // CRITICAL: Always clear cookies for logout all
    // User is logged out from all sessions, so clear all auth cookies
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
    
    res.cookies.set('auth', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (error) {
    console.error('[LogoutAll] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

