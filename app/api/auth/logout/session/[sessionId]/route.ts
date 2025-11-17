// app/api/auth/logout/session/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { LogoutResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * POST /api/auth/logout/session/[sessionId]
 * Logout from a specific session by session ID
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const api = createApiInstance(req);
    
    // Extract sessionId from params
    const { sessionId } = await params;
    
    // Validate sessionId
    if (!sessionId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Session ID is required',
        errors: ['Session ID is required'],
        data: {
          isSuccess: false,
          message: 'Session ID is required'
        }
      } as LogoutResponse, { status: 400 });
    }
    
    // Call upstream API - empty body, sessionId is in path
    const upstream = await api.api.logoutBySessionId(sessionId, {}, {});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T>
    const response: LogoutResponse = {
      isSuccess: !!upstream.data?.data?.isSuccess,
      message: upstream.data?.message || 'Session logged out successfully',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data ? {
        isSuccess: upstream.data.data.isSuccess ?? false,
        message: upstream.data.data.message || upstream.data?.message || 'Session logged out successfully'
      } : {
        isSuccess: false,
        message: upstream.data?.message || 'Session logged out successfully'
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

    // NOTE: Do NOT clear cookies here - only the specific session is logged out
    // Current session remains active unless it's the one being logged out
    // The client will handle clearing cookies if needed based on the response

    return res;
  } catch (error) {
    console.error('[LogoutBySessionId] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

