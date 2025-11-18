// app/api/auth/sessions/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetSessionsPaginatedResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * GET /api/auth/sessions
 * Get paginated list of user sessions
 * Refresh token handling is done automatically in generatedClient.ts
 */
export async function GET(req: NextRequest) {
  try {
    // Get API instance (handles refresh tokens automatically via generatedClient)
    const api = createApiInstance(req);

    // Extract query parameters from URL
    const { searchParams } = new URL(req.url);
    
    // Build query parameters for upstream API
    const queryParams: {
      pageNumber: number;
      pageSize: number;
      userId?: string;
      deviceId?: string;
      isActive?: boolean;
      isRevoked?: boolean;
      isExpired?: boolean;
      searchTerm?: string;
      sortBy?: string;
      sortDirection?: string;
    } = {
      pageNumber: parseInt(searchParams.get('pageNumber') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
    };

    // Add optional parameters if present
    if (searchParams.has('userId')) {
      queryParams.userId = searchParams.get('userId') || undefined;
    }
    if (searchParams.has('deviceId')) {
      queryParams.deviceId = searchParams.get('deviceId') || undefined;
    }
    if (searchParams.has('isActive')) {
      queryParams.isActive = searchParams.get('isActive') === 'true';
    }
    if (searchParams.has('isRevoked')) {
      queryParams.isRevoked = searchParams.get('isRevoked') === 'true';
    }
    if (searchParams.has('isExpired')) {
      queryParams.isExpired = searchParams.get('isExpired') === 'true';
    }
    if (searchParams.has('searchTerm')) {
      queryParams.searchTerm = searchParams.get('searchTerm') || undefined;
    }
    if (searchParams.has('sortBy')) {
      queryParams.sortBy = searchParams.get('sortBy') || undefined;
    }
    if (searchParams.has('sortDirection')) {
      queryParams.sortDirection = searchParams.get('sortDirection') || undefined;
    }

    // Call upstream API - if 401, generatedClient will refresh token and retry
    const upstream = await api.api.getSessionsPaginated(queryParams, {});
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T> format
    const response: GetSessionsPaginatedResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data?.data,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'Sessions retrieved successfully' : 'Failed to get sessions'),
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.isSuccess && upstream.data?.data ? {
        items: upstream.data.data.items || null,
        totalCount: upstream.data.data.totalCount || 0,
        pageNumber: upstream.data.data.pageNumber || queryParams.pageNumber,
        pageSize: upstream.data.data.pageSize || queryParams.pageSize,
      } : undefined
    };

    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

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
    console.error('[GetSessions] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}

