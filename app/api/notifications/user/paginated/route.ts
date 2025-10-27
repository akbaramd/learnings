// app/api/notifications/user/paginated/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiResponse, handleApiError } from '@/app/api/generatedClient';
import { GetNotificationsPaginatedResponse, GetNotificationsPaginatedRequest } from '@/src/store/notifications/notifications.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);
    
    // Extract and validate required query parameters
    const pageNumber = parseInt(searchParams.get('pageNumber') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    if (isNaN(pageNumber) || isNaN(pageSize) || pageNumber < 1 || pageSize < 1) {
      const errorResponse: GetNotificationsPaginatedResponse = {
        result: null,
        errors: ['Invalid pagination parameters']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const query: GetNotificationsPaginatedRequest = {
      pageNumber,
      pageSize,
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      context: searchParams.get('context') || undefined,
      action: searchParams.get('action') || undefined,
    };

    // Call the upstream API
    const upstream = await api.api.getUserNotificationsPaginated(query, {});
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetNotificationsPaginatedResponse = {
      result: status === 200 && upstream.data?.isSuccess && upstream.data.data ? {
        items: upstream.data.data.items || [],
        totalCount: upstream.data.data.totalCount || 0,
        pageNumber: upstream.data.data.pageNumber || pageNumber,
        pageSize: upstream.data.data.pageSize || pageSize,
        totalPages: Math.ceil((upstream.data.data.totalCount || 0) / (upstream.data.data.pageSize || pageSize)) || 1,
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Failed to get paginated notifications'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Get notifications paginated BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
}
