// app/api/auth/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetSessionsPaginatedResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * GET /api/auth/sessions
 * Get paginated list of user sessions
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const userId = searchParams.get('userId') || undefined;
    const deviceId = searchParams.get('deviceId') || undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    const isRevoked = searchParams.get('isRevoked') === 'true' ? true : searchParams.get('isRevoked') === 'false' ? false : undefined;
    const isExpired = searchParams.get('isExpired') === 'true' ? true : searchParams.get('isExpired') === 'false' ? false : undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortDirection = searchParams.get('sortDirection') || undefined;

    // Call upstream API
    const upstream = await api.api.getSessionsPaginated({
      pageNumber,
      pageSize,
      userId,
      deviceId,
      isActive,
      isRevoked,
      isExpired,
      searchTerm,
      sortBy,
      sortDirection,
    }, {});
    
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T>
    const response: GetSessionsPaginatedResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Sessions retrieved successfully',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined,
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

    return res;
  } catch (error) {
    console.error('[Sessions] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

