// app/api/notifications/user/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetAllNotificationsResponse, GetAllNotificationsRequest } from '@/src/store/notifications/notifications.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const query: GetAllNotificationsRequest = {
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      context: searchParams.get('context') || undefined,
      action: searchParams.get('action') || undefined,
    };

    // Call the upstream API
    const upstream = await api.api.getAllUserNotifications({}, query);
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetAllNotificationsResponse = {
      result: status === 200 && upstream.data?.isSuccess && upstream.data.data ? {
        items: upstream.data.data.items || [],
        totalCount: upstream.data.data.totalCount || 0,
        pageNumber: upstream.data.data.pageNumber || 1,
        pageSize: upstream.data.data.pageSize || 10,
        totalPages: Math.ceil((upstream.data.data.items?.length || 0) / (upstream.data.data.pageSize || 10)) || 1,
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Failed to get notifications'] : null
    };
  } catch (error) {
    console.error('Get all notifications BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
}
