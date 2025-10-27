// app/api/auth/session/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { SessionResponse } from '@/src/store/auth/auth.types';
import { ensureCsrfCookie } from '@/src/lib/csrf';
import { createApiInstance } from '@/app/api/generatedClient';

// Force Node.js runtime for crypto module support
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Create initial response for CSRF cookie
    const res = new NextResponse();
    ensureCsrfCookie(req, res);
    
    // Try to get current user - simple check
    const api = createApiInstance(req);
    const upstream = await api.api.getCurrentUser({});
    const ok = upstream.status === 200 && upstream.data?.isSuccess && upstream.data?.data;

    // If authenticated, return 200
    if (ok) {
      const response: SessionResponse = {
        isSuccess: true,
        message: 'User is authenticated',
        data: { authenticated: true }
      };

      const finalRes = NextResponse.json(response, { status: 200 });
      finalRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      
      const csrfCookie = res.headers.get('set-cookie');
      if (csrfCookie) {
        finalRes.headers.set('set-cookie', csrfCookie);
      }
      
      return finalRes;
    }

    // If NOT authenticated, return 401
    const response: SessionResponse = {
      isSuccess: false,
      message: 'User is not authenticated',
      data: { authenticated: false }
    };

    const finalRes = NextResponse.json(response, { status: 401 });
    finalRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const csrfCookie = res.headers.get('set-cookie');
    if (csrfCookie) {
      finalRes.headers.set('set-cookie', csrfCookie);
    }
    
    return finalRes;
  } catch (error) {
    console.error('Session BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    // In case of error, return 401 (assume not authenticated)
    const errorResponse: SessionResponse = {
      isSuccess: false,
      message: 'Session check failed',
      data: { authenticated: false }
    };
    
    const errorRes = new NextResponse();
    ensureCsrfCookie(req, errorRes);
    const finalRes = NextResponse.json(errorResponse, { status: 401 });
    finalRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    const csrfCookie = errorRes.headers.get('set-cookie');
    if (csrfCookie) {
      finalRes.headers.set('set-cookie', csrfCookie);
    }
    
    return finalRes;
  }
}
