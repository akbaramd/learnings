// app/api/auth/logout/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { LogoutResponse } from '@/src/store/auth/auth.types';
import { cookies } from 'next/headers';
import { Api } from '@/src/services/Api';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get access token from cookies
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      const errorResponse: LogoutResponse = {
        result: null,
        errors: ['No access token found']
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse request body to get refreshToken if provided
    let requestBody: { refreshToken?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // If no body provided, use empty object (refreshToken will be null)
      requestBody = {};
    }

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://auth.wa-nezam.org';
    
    console.log('Logout API call details:', {
      baseURL,
      hasAccessToken: !!accessToken,
      tokenLength: accessToken?.length,
      refreshToken: requestBody.refreshToken || 'null'
    });

    // فراخوانی متد logout upstream with proper request structure and authorization
    let upstream;
    let status = 200;
    
    try {
      upstream = await new Api({
        baseURL: baseURL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      }).api.logout({
        refreshToken: requestBody.refreshToken || null
      }); 
      status = upstream.status ?? 200;
    } catch (apiError) {
      console.error('Upstream logout API failed:', {
        name: apiError instanceof Error ? apiError.name : 'Unknown',
        message: apiError instanceof Error ? apiError.message : String(apiError),
        baseURL,
      });
      
      // If upstream API fails, still proceed with local logout
      upstream = {
        status: 200,
        data: { isSuccess: true, message: 'Local logout completed (upstream unavailable)' }
      };
      status = 200;
    }

    // Strongly typed response structure
    const response: LogoutResponse = {
      result: status === 200 && upstream.data?.isSuccess ? {
        isSuccess: true,
        message: upstream.data.message || 'Logged out successfully'
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Logout failed'] : null
    };

    // پاک‌سازی کوکی‌ها - فقط در صورت موفقیت logout
    const res = NextResponse.json(response, { status });
    
    // Only clear cookies if logout API call was successful
    if (status === 200 && upstream.data?.isSuccess) {
      console.log('Logout successful, clearing cookies');
      
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
    } else {
      console.log('Logout failed, keeping cookies');
    }

    return res;
  } catch (error) {
    console.error('Logout BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    const errorResponse: LogoutResponse = {
      result: null,
      errors: ['Internal server error']
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
