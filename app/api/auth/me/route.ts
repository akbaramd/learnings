// app/api/auth/me/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetMeResponse, UserRole } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // استفاده از getCurrentUser برای دریافت پروفایل کامل
    const upstream = await api.api.getCurrentUser({}); 
    const status = upstream.status ?? 200;

    // Strongly typed response structure using ApplicationResult
    const response: GetMeResponse = {
      isSuccess: status === 200 && upstream.data?.isSuccess && !!upstream.data.data?.id || false,
      message: upstream.data?.message || (status === 200 && upstream.data?.isSuccess ? 'User profile retrieved successfully' : 'Failed to get user profile'),
      errors: upstream.data?.errors || undefined,
      data: status === 200 && upstream.data?.isSuccess && upstream.data.data?.id ? {
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

    const res = NextResponse.json(response, { status });
    
    // Cache-Control برای اطلاعات حساس
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Get user profile BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}
