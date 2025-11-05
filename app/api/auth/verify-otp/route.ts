// app/api/auth/verify-otp/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { VerifyOtpResponse } from '@/src/store/auth/auth.types';
import { ensureCsrfCookie } from '@/src/lib/csrf';
import { createApiInstance } from '@/app/api/generatedClient';

// Force Node.js runtime for crypto module support
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Ensure CSRF cookie is set in response
    const res = NextResponse.next();
    ensureCsrfCookie(req, res);
    
    const api = createApiInstance(req);
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

    // Strongly typed response structure using ApplicationResult
    const response: VerifyOtpResponse = {
      isSuccess: status === 200 && upstream.data?.isSuccess || false,
      message: upstream.data?.message || (status === 200 && upstream.data?.isSuccess ? 'OTP verified successfully' : 'Verification failed'),
      errors: upstream.data?.errors || undefined,
      data: status === 200 && upstream.data?.isSuccess ? {
        userId: upstream.data.data?.userId || ''
      } : undefined
    };

    const result = NextResponse.json(response, { status });
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Store tokens in session cookies if verification was successful
    // These tokens are stored server-side only (httpOnly) - clients never see them
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Store access token in httpOnly cookie (15 minutes)
        // Server-side refresh will use this automatically when it expires
        result.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        });
      }
      
      if (refreshToken) {
        // Store refresh token in httpOnly cookie (7 days)
        // Used by generatedClient.ts for automatic token refresh
        result.cookies.set('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
      }
    }
    
    // Apply CSRF cookie if set
    const csrfCookie = res.headers.get('set-cookie');
    if (csrfCookie) {
      result.headers.append('set-cookie', csrfCookie);
    }
    
    // Forward upstream cookies (if any additional cookies from upstream)
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => result.headers.append('set-cookie', c));
      } else {
        result.headers.set('set-cookie', setCookie as string);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[VerifyOTP] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    const errorResponse: VerifyOtpResponse = {
      isSuccess: false,
      message: 'Failed to verify OTP. Please check your code and try again.',
      errors: [error instanceof Error ? error.message : String(error)]
    };
    
    const result = NextResponse.json(errorResponse, { status: 400 });
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Try to set CSRF cookie even on error
    const res = NextResponse.next();
    ensureCsrfCookie(req, res);
    const csrfCookie = res.headers.get('set-cookie');
    if (csrfCookie) {
      result.headers.append('set-cookie', csrfCookie);
    }
    
    return result;
  }
}
