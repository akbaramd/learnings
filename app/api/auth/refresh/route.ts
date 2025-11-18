// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { RefreshResponse, RefreshTokenRequest } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';
import { cookies } from 'next/headers';
import { getRequestInfo } from '@/src/lib/requestInfo';

export const runtime = 'nodejs';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * This endpoint:
 * - Gets refresh token from httpOnly cookies (BFF pattern)
 * - Calls upstream API to refresh token
 * - Updates cookies with new tokens (token rotation)
 * - Returns new tokens in response
 * 
 * Refresh token handling is done server-side (BFF) for security
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    
    // Get refresh token from cookies (BFF pattern)
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Refresh token not found',
        errors: ['Refresh token not found in cookies'],
        data: undefined,
      } as RefreshResponse, { status: 401 });
    }

    // Extract device info from request
    const body = await req.json().catch(() => ({}));
    const requestInfo = getRequestInfo(req, body);

    // Prepare request body for upstream API
    const requestBody: RefreshTokenRequest = {
      refreshToken: refreshToken,
      // Override with server-extracted values if not provided by client
      deviceId: body.deviceId || requestInfo.deviceId || null,
      userAgent: body.userAgent || requestInfo.userAgent || null,
      ipAddress: body.ipAddress || requestInfo.ipAddress || null,
    };

    // Call upstream API to refresh token
    const upstream = await api.api.refreshToken(requestBody, {});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T>
    // Upstream returns: { isSuccess: boolean, data: { accessToken, refreshToken }, message, errors }
    const refreshData = upstream.data?.data;
    const response: RefreshResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!refreshData,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'Token refreshed successfully' : 'Token refresh failed'),
      errors: upstream.data?.errors || undefined,
      data: refreshData ? {
        isSuccess: true, // If we have data, refresh was successful
        message: upstream.data?.message || 'Token refreshed successfully',
        accessToken: refreshData.accessToken || undefined,
        refreshToken: refreshData.refreshToken || undefined,
      } : undefined,
    };

    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    // If refresh was successful, update cookies with new tokens (token rotation)
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken: newRefreshToken } = upstream.data.data;

      if (accessToken) {
        // Update access token cookie (15 minutes)
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        });
        console.log('[Refresh] Access token cookie updated');
      }

      if (newRefreshToken) {
        // Update refresh token cookie (7 days) - Token Rotation
        res.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        console.log('[Refresh] Refresh token cookie updated (token rotation)');
      }

      // Signal that token was refreshed (for client-side sync)
      res.headers.set('x-token-refreshed', 'true');
    } else {
      // If refresh failed, clear cookies
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
      
      console.log('[Refresh] Refresh failed, cookies cleared');
    }

    // Forward upstream cookies if present
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie as string);
      }
    }

    return res;
  } catch (error) {
    console.error('[Refresh] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}

