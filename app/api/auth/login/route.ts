// app/api/auth/login/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { SendOtpResponse } from '@/src/store/auth/auth.types';
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

    // استفاده از sendOtp برای ارسال کد OTP
    const upstream = await api.api.sendOtp(requestBody); 
    const status = upstream.status ?? upstream?.status ?? 200;

    // فوروارد کردن کوکی‌هایی که بک‌اند ست می‌کند (refresh cookie)
    const setCookie = upstream.headers?.['set-cookie'];

    // Strongly typed response structure using ApplicationResult
    const response: SendOtpResponse = {
      isSuccess: upstream.data?.data?.challengeId ? true : false,
      message: upstream.data?.message || (upstream.data?.data?.challengeId ? 'OTP sent successfully' : 'Send OTP failed'),
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data?.challengeId ? {
        challengeId: upstream.data.data.challengeId,
        maskedPhoneNumber: upstream.data.data.maskedPhoneNumber || undefined
      } : undefined
    };

    const result = NextResponse.json(response, { status });
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Apply CSRF cookie if set
    const csrfCookie = res.headers.get('set-cookie');
    if (csrfCookie) {
      result.headers.append('set-cookie', csrfCookie);
    }
    
    // Forward upstream cookies (e.g., refresh token from upstream)
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => result.headers.append('set-cookie', c));
      } else {
        result.headers.set('set-cookie', setCookie as string);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[SendOTP] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    const errorResponse: SendOtpResponse = {
      isSuccess: false,
      message: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
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
