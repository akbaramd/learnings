// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance } from '@/app/api/generatedClient';
import { cookies } from 'next/headers';
import { SessionResponse, SessionData } from '@/src/store/auth/auth.types';

/**
 * GET /api/auth/session
 * Check authentication status with auto-refresh logic
 * 
 * This endpoint:
 * - Always returns 200 (never 401 to avoid refresh loops)
 * - Checks if user is authenticated by calling getCurrentUser
 * - Returns authenticated: true/false
 * - Optionally returns accessToken for proactive refresh
 * - Auto-refreshes token if expired (via generatedClient)
 */
export async function GET(req: NextRequest) {
  try {
    // Get API instance (handles refresh tokens automatically via generatedClient)
    const api = createApiInstance(req);

    // Try to get current user - this will auto-refresh token if needed
    const upstream = await api.api.getCurrentUser({});
    const status = upstream.status ?? 200;

    // Check if user is authenticated
    const isAuthenticated = 
      status === 200 && 
      upstream.data?.isSuccess === true && 
      !!upstream.data?.data?.id;

    // Get access token from cookies for proactive refresh (optional)
    let accessToken: string | undefined = undefined;
    if (isAuthenticated) {
      try {
        const cookieStore = await cookies();
        accessToken = cookieStore.get('accessToken')?.value || undefined;
      } catch (error) {
        // Ignore error - accessToken is optional
        console.warn('[Session] Failed to get access token from cookies:', error);
      }
    }

    // Transform to ApplicationResult<T> format
    // IMPORTANT: Always return 200 to avoid refresh loops
    const response: SessionResponse = {
      isSuccess: true, // Always true - we return status in data.authenticated
      message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
      errors: undefined,
      data: {
        authenticated: isAuthenticated,
        // Only include accessToken if authenticated (for proactive refresh)
        ...(isAuthenticated && accessToken ? { accessToken } : {}),
      } as SessionData,
    };

    // Create response with headers
    // CRITICAL: Always return 200, never 401
    const res = NextResponse.json(response, { status: 200 });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    // Forward Set-Cookie headers from upstream if present (after token refresh)
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie as string);
      }
    }

    // Forward x-token-refreshed header if present (signals that token was refreshed server-side)
    const tokenRefreshed = upstream.headers?.['x-token-refreshed'];
    if (tokenRefreshed) {
      res.headers.set('x-token-refreshed', String(tokenRefreshed));
    }

    return res;
  } catch (error) {
    console.error('[Session] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    // Even on error, return 200 with authenticated: false
    // This prevents refresh loops
    const errorResponse: SessionResponse = {
      isSuccess: true,
      message: 'Session check failed',
      errors: error instanceof Error ? [error.message] : ['Unknown error'],
      data: {
        authenticated: false,
      },
    };

    return NextResponse.json(errorResponse, { status: 200 });
  }
}

