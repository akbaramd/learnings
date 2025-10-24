// app/api/auth/logout/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiForRequest } from '@/src/services/server/generatedClient';
import { LogoutResponse } from '@/src/store/auth/auth.types';

export async function POST(req: NextRequest) {
  try {
    const api = createApiForRequest(req);

    // فراخوانی متد logout upstream
    const upstream = await api.api.logout({}); 
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: LogoutResponse = {
      result: status === 200 && upstream.data?.isSuccess ? {
        isSuccess: true,
        message: upstream.data.message || 'Logged out successfully'
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Logout failed'] : null
    };

    // پاک‌سازی کوکی‌ها - ست کردن کوکی‌های خالی
    const res = NextResponse.json(response, { status });
    
    // پاک‌سازی کوکی‌های احراز هویت
    res.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    
    res.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });

    return res;
  } catch (error) {
    console.error('Logout BFF error:', error);
    const errorResponse: LogoutResponse = {
      result: null,
      errors: ['Internal server error']
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
