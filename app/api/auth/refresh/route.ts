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
    
    const isDev = process.env.NODE_ENV === 'development';
    
    // Get refresh token from cookies (BFF pattern)
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (isDev) {
      const allCookies = cookieStore.getAll();
      console.log('[Refresh] 📋 Cookies in store:', {
        totalCookies: allCookies.length,
        cookieNames: allCookies.map(c => c.name),
        hasRefreshToken: !!refreshToken,
        hasAccessToken: !!cookieStore.get('accessToken'),
        refreshTokenLength: refreshToken?.length || 0,
        refreshTokenPrefix: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null',
      });
    }

    if (!refreshToken) {
      if (isDev) {
        console.error('[Refresh] ❌ Refresh token not found in cookies', {
          allCookieNames: cookieStore.getAll().map(c => c.name),
          requestUrl: req.url,
          requestMethod: req.method,
        });
      }
      return NextResponse.json({
        isSuccess: false,
        message: 'Refresh token not found',
        errors: ['Refresh token not found in cookies'],
        data: undefined,
      } as RefreshResponse, { status: 401 });
    }

    if (isDev) {
      console.log('[Refresh] ✅ Refresh token found in cookies', {
        refreshTokenLength: refreshToken.length,
        refreshTokenPrefix: refreshToken.substring(0, 20) + '...',
      });
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

    if (isDev) {
      console.log('[Refresh] 📤 Sending refresh request to upstream API:', {
        upstreamEndpoint: 'api.refreshToken',
        requestBody: {
          refreshToken: `${refreshToken.substring(0, 20)}... (${refreshToken.length} chars)`,
          deviceId: requestBody.deviceId || 'null',
          userAgent: requestBody.userAgent || 'null',
          ipAddress: requestBody.ipAddress || 'null',
        },
        fullRequestBody: JSON.stringify({
          ...requestBody,
          refreshToken: `${refreshToken.substring(0, 20)}... (hidden)`,
        }, null, 2),
      });
    }

    // Call upstream API to refresh token
    const upstream = await api.api.refreshToken(requestBody, {});
    const status = upstream.status ?? 200;

    if (isDev) {
      console.log('[Refresh] 📥 Received response from upstream API:', {
        status: upstream.status,
        statusText: upstream.statusText || 'N/A',
        hasData: !!upstream.data,
        isSuccess: upstream.data?.isSuccess,
        hasDataData: !!upstream.data?.data,
        dataKeys: upstream.data?.data ? Object.keys(upstream.data.data) : [],
        hasAccessToken: !!upstream.data?.data?.accessToken,
        hasRefreshToken: !!upstream.data?.data?.refreshToken,
        message: upstream.data?.message,
        errors: upstream.data?.errors,
        fullResponse: JSON.stringify({
          ...upstream.data,
          data: upstream.data?.data ? {
            ...upstream.data.data,
            accessToken: upstream.data.data.accessToken ? `${upstream.data.data.accessToken.substring(0, 20)}... (hidden)` : undefined,
            refreshToken: upstream.data.data.refreshToken ? `${upstream.data.data.refreshToken.substring(0, 20)}... (hidden)` : undefined,
          } : undefined,
        }, null, 2),
      });
    }

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

      if (isDev) {
        console.log('[Refresh] 🔄 Updating cookies with new tokens:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!newRefreshToken,
          accessTokenLength: accessToken?.length || 0,
          refreshTokenLength: newRefreshToken?.length || 0,
          accessTokenPrefix: accessToken ? `${accessToken.substring(0, 20)}...` : 'null',
          refreshTokenPrefix: newRefreshToken ? `${newRefreshToken.substring(0, 20)}...` : 'null',
        });
      }

      if (accessToken) {
        // Update access token cookie (15 minutes)
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        });
        if (isDev) {
          console.log('[Refresh] ✅ Access token cookie updated:', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60,
            tokenLength: accessToken.length,
          });
        }
      } else {
        if (isDev) {
          console.warn('[Refresh] ⚠️ No accessToken in upstream response');
        }
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
        if (isDev) {
          console.log('[Refresh] ✅ Refresh token cookie updated (token rotation):', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            tokenLength: newRefreshToken.length,
            note: 'Old refresh token rotated, new one stored',
          });
        }
      } else {
        if (isDev) {
          console.warn('[Refresh] ⚠️ No refreshToken in upstream response (token rotation may have failed)');
        }
      }

      // Log all Set-Cookie headers that will be sent
      if (isDev) {
        const setCookieHeaders = res.headers.getSetCookie();
        console.log('[Refresh] 📋 Set-Cookie headers count:', setCookieHeaders.length);
        setCookieHeaders.forEach((cookie, index) => {
          console.log(`[Refresh] Set-Cookie[${index}]:`, cookie.substring(0, 100) + '...');
        });
      }

      // Signal that token was refreshed (for client-side sync)
      res.headers.set('x-token-refreshed', 'true');
      
      if (isDev) {
        console.log('[Refresh] ✅✅ Token refresh completed successfully');
      }
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

