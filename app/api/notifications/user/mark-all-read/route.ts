// app/api/notifications/user/mark-all-read/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { MarkAllAsReadResponse } from '@/src/store/notifications/notifications.types';

export async function PUT(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Call the upstream API
    const upstream = await api.api.markAllAsRead({});
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: MarkAllAsReadResponse = {
      result: status === 200 ? { success: true } : null,
      errors: status !== 200 ? ['Failed to mark all notifications as read'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Mark all notifications as read BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as Error);
  }
}
