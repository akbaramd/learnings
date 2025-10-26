// app/api/notifications/user/unread-count/context/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetUnreadCountByContextResponse } from '@/src/store/notifications/notifications.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Call the upstream API
    const upstream = await api.api.getUnreadCountByContext({});
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetUnreadCountByContextResponse = {
      result: status === 200 && upstream.data?.isSuccess && upstream.data.data ? {
        totalCount: upstream.data.data.totalCount || 0,
        contextBreakdown: upstream.data.data.contextBreakdown || {},
        actionBreakdown: upstream.data.data.actionBreakdown || {},
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Failed to get unread count by context'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Get unread count by context BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
}
