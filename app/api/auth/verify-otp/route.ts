// app/api/auth/verify-otp/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiForRequest } from '@/src/services/server/generatedClient';
import { cookies } from 'next/headers';
import { VerifyOtpResponse } from '@/src/store/auth/auth.types';

export async function POST(req: NextRequest) {
  try {
    const api = createApiForRequest(req);
    const body = await req.json();

    // Add scope parameter for the API call
    const requestBody = {
      ...body,
      scope: 'app' // Set scope to 'app' as required by the API
    };

    // استفاده از verifyOtp برای تأیید کد OTP
    const upstream = await api.api.verifyOtp(requestBody); 
    const status = upstream.status ?? upstream?.status ?? 200;

    // فوروارد کردن کوکی‌هایی که بک‌اند ست می‌کند (refresh cookie)
    const setCookie = upstream.headers?.['set-cookie'];

    // Strongly typed response structure
    const response: VerifyOtpResponse = {
      result: status === 200 && upstream.data?.isSuccess ? {
        userId: upstream.data.data?.userId || null,
        isSuccess: true
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Verification failed'] : []
    };

    const res = NextResponse.json(response, { status });
    
    // Store tokens in session cookies if verification was successful
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Store access token in httpOnly cookie
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }
      
      if (refreshToken) {
        // Store refresh token in httpOnly cookie
        res.cookies.set('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
    }
    
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }
    return res;
  } catch (error) {
    console.error('Verify OTP BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    const errorResponse: VerifyOtpResponse = {
      result: null,
      errors: [error instanceof Error ? error.message : String(error), 'Failed to verify OTP. Please check your code and try again.']
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }
}
