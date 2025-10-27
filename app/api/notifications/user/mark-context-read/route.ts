// app/api/notifications/user/mark-context-read/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiResponse, handleApiError } from '@/app/api/generatedClient';
import { MarkByContextAsReadResponse, MarkByContextAsReadRequest } from '@/src/store/notifications/notifications.types';
import { AxiosError } from 'axios';
  
export async function PUT(req: NextRequest) {
  try { 
    const api = createApiInstance(req);

    // Parse request body
    const body: MarkByContextAsReadRequest = await req.json();
    
    // Validate context parameter
    if (!body.context || typeof body.context !== 'string') {
      const errorResponse: MarkByContextAsReadResponse = {
        result: null,
        errors: ['Context parameter is required']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call the upstream API
    const upstream = await api.api.markByContextAsRead(body);
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: MarkByContextAsReadResponse = {
      result: status === 200 ? { success: true } : null,
      errors: status !== 200 ? ['Failed to mark notifications by context as read'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Mark notifications by context as read BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
}
