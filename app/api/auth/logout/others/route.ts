// app/api/auth/logout/others/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { LogoutResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * POST /api/auth/logout/others
 * Logout from all other sessions (keep current session active)
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    
    // Call upstream API - empty body for logout others
    const upstream = await api.api.logoutAllOtherSessions({}, {});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T>
    const response: LogoutResponse = {
      isSuccess: !!upstream.data?.data?.isSuccess,
      message: upstream.data?.message || 'Logged out from all other sessions successfully',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data ? {
        isSuccess: upstream.data.data.isSuccess ?? false,
        message: upstream.data.data.message || upstream.data?.message || 'Logged out from all other sessions successfully'
      } : {
        isSuccess: false,
        message: upstream.data?.message || 'Logged out from all other sessions successfully'
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

    // NOTE: Do NOT clear cookies here - user stays logged in on current session
    // Only other sessions are logged out

    return res;
  } catch (error) {
    console.error('[LogoutOthers] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

