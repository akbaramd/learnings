// app/api/notifications/[notificationId]/read/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { MarkAsReadResponse } from '@/src/store/notifications/notifications.types';
import { AxiosError } from 'axios';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const resolvedParams = await params;
    
    // Validate notificationId parameter
    if (!resolvedParams.notificationId || typeof resolvedParams.notificationId !== 'string') {
      const errorResponse: MarkAsReadResponse = {
        result: null,
        errors: ['Invalid notification ID']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call the upstream API
    const upstream = await api.api.markAsRead(resolvedParams.notificationId, {});
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: MarkAsReadResponse = {
      result: status === 200 ? { success: true } : null,
      errors: status !== 200 ? ['Failed to mark notification as read'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Mark notification as read BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
}
