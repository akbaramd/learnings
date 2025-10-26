// app/api/auth/login/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiForRequest } from '@/src/services/server/generatedClient';
import { SendOtpResponse } from '@/src/store/auth/auth.types';

export async function POST(req: NextRequest) {
  try {
    const api = createApiForRequest(req);
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

    // Strongly typed response structure
    const response: SendOtpResponse = {
      result: upstream.data?.data?.challengeId ? {
        challengeId: upstream.data.data.challengeId,
        maskedPhoneNumber: upstream.data.data.maskedPhoneNumber
      } : null,
      errors: upstream.data?.errors || ['Send OTP failed']
    };

    const res = NextResponse.json(response, { status });
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    } 
    return res;
  } catch (error) {
    console.error('Send OTP BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    const errorResponse: SendOtpResponse = {
      result: null,
      errors: [error instanceof Error ? error.message : String(error), 'Failed to send OTP. Please try again.']
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }
}
