// app/api/auth/me/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { Api } from '@/src/services/Api';
import { cookies } from 'next/headers';
import { GetMeResponse } from '@/src/store/auth/auth.types';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get access token from cookies
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      const errorResponse: GetMeResponse = {
        result: null,
        errors: ['No access token found']
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://auth.wa-nezam.org';
    
    const api = new Api({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });

    // استفاده از getCurrentUser برای دریافت پروفایل کامل
    const upstream = await api.api.getCurrentUser({}); 
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetMeResponse = {
      result: status === 200 && upstream.data?.isSuccess && upstream.data.data?.id ? {
        id: upstream.data.data.id,
        name: upstream.data.data.name || undefined,
        firstName: upstream.data.data.firstName || undefined,
        lastName: upstream.data.data.lastName || undefined,
        nationalId: upstream.data.data.nationalId || undefined,
        phone: upstream.data.data.phone || undefined,
        roles: upstream.data.data.roles || undefined,
        claims: upstream.data.data.claims || undefined,
        preferences: upstream.data.data.preferences || undefined
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Failed to get user profile'] : null
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
    
    const errorResponse: GetMeResponse = {
      result: null,
      errors: ['Internal server error']
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
