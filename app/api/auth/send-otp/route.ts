// app/api/auth/send-otp/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { SendOtpResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';
import { getRequestInfo } from '@/src/lib/requestInfo';

/**
 * POST /api/auth/send-otp
 * Send OTP code to user's phone number
 * 
 * This endpoint:
 * - Receives national code and device info from client
 * - Calls upstream API to send OTP
 * - Returns challengeId and maskedPhoneNumber
 */
export async function POST(req: NextRequest) {
  try {
    // Get API instance (uses UPSTREAM_API_BASE_URL)
    const api = createApiInstance(req);
    
    // Extract request body
    const body = await req.json();
    const { nationalCode } = body;
    
    // Validate input
    if (!nationalCode || typeof nationalCode !== 'string') {
      return NextResponse.json({ 
        isSuccess: false, 
        message: 'National code is required', 
        errors: ['National code is required'],
        data: undefined
      } as SendOtpResponse, { status: 400 });
    }
    
    // Get request info (deviceId, userAgent, ipAddress)
    const requestInfo = getRequestInfo(req, body);
    
    // Call upstream API
    const upstream = await api.api.sendOtp({
      nationalCode,
      purpose: 'login',
      scope: 'app',
      deviceId: requestInfo.deviceId || null,
      userAgent: requestInfo.userAgent || null,
      ipAddress: requestInfo.ipAddress || null,
    });
    const status = upstream.status ?? 200;
    
    // Transform to ApplicationResult<T>
    const response: SendOtpResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data?.data?.challengeId,
      message: upstream.data?.message || 'OTP sent successfully',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data?.challengeId ? {
        challengeId: upstream.data.data.challengeId,
        maskedPhoneNumber: upstream.data.data.maskedPhoneNumber || undefined
      } : undefined
    };
    
    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // Forward upstream cookies if present
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie as string);
      }
    }
    
    return res;
  } catch (error) {
    console.error('[SendOtp] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

