// app/api/auth/me/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetMeResponse, UserRole } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * GET /api/auth/me
 * Get current user profile
 * Refresh token handling is done automatically in generatedClient.ts
 */
export async function GET(req: NextRequest) {
  try {
    // Get API instance (handles refresh tokens automatically via generatedClient)
    const api = createApiInstance(req);

    // Call upstream API - if 401, generatedClient will refresh token and retry
    const upstream = await api.api.getCurrentUser({});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T> format
    const response: GetMeResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data.data?.id,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'User profile retrieved successfully' : 'Failed to get user profile'),
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.isSuccess && upstream.data.data?.id ? {
        id: upstream.data.data.id,
        name: upstream.data.data.name || undefined,
        firstName: upstream.data.data.firstName || undefined,
        lastName: upstream.data.data.lastName || undefined,
        nationalId: upstream.data.data.nationalId || undefined,
        phone: upstream.data.data.phone || undefined,
        roles: upstream.data.data.roles?.map(role => role as UserRole) || undefined,
        claims: upstream.data.data.claims || undefined,
        preferences: upstream.data.data.preferences || undefined
      } : undefined
    };

    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Set prefetch flag to prevent duplicate getMe calls in client
    // If SSR already fetched this, client should skip the fetch
    res.headers.set('x-me-prefetched', '1');

    // Forward Set-Cookie headers from upstream if present
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
    console.error('[GetMe] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}
