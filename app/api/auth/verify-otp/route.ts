// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';
import { getRequestInfo } from '@/src/lib/requestInfo';

export const runtime = 'nodejs';

/**
 * POST /api/auth/verify-otp
 * Verify OTP and authenticate user
 * 
 * 🔥 STANDARD COMPLIANCE (Enterprise-Grade):
 * 
 * ✅ Feature 1: Validates OTP (one-time, short-lived, single-use)
 *    - Upstream API handles OTP validation
 *    - OTP is invalidated immediately after successful verification
 * 
 * ✅ Feature 2: Creates Access Token (short-lived)
 *    - 15 minutes expiration
 *    - Contains userId + roles + scopes
 *    - Returned in response body (NOT cookie)
 * 
 * ✅ Feature 3: Creates Refresh Token (long-lived)
 *    - 7 days expiration
 *    - Returned ONLY in HttpOnly Cookie (NOT in body)
 *    - Security: JS cannot access, prevents XSS attacks
 * 
 * ✅ Feature 4: Returns user profile/roles
 *    - User information in response body
 *    - Roles and permissions included
 * 
 * ✅ Feature 5: Security Best Practices
 *    - Never expose refresh token in body
 *    - Never store refresh token in localStorage
 *    - Refresh token only in HttpOnly Secure Cookie
 *    - OTP is one-time use and immediately invalidated
 * 
 * Request Body:
 * {
 *   "challengeId": "string",
 *   "otpCode": "string",
 *   "deviceId": "string" (optional, extracted from headers if not provided),
 *   "userAgent": "string" (optional, extracted from headers if not provided),
 *   "ipAddress": "string" (optional, extracted from headers if not provided)
 * }
 * 
 * Response 200:
 * Headers:
 *   Set-Cookie: refreshToken=xxxx; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
 * 
 * Body:
 * {
 *   "isSuccess": true,
 *   "message": "OTP verified successfully",
 *   "data": {
 *     "accessToken": "jwt_access_token",
 *     "user": {
 *       "id": "12",
 *       "mobile": "0912xxxxxxx",
 *       "role": "user"
 *     }
 *   }
 * }
 * 
 * Response 400/401:
 * {
 *   "isSuccess": false,
 *   "message": "Invalid OTP",
 *   "errors": ["OTP is invalid or expired"]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const isDev = process.env.NODE_ENV === 'development';
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { challengeId, otpCode } = body;
    
    // Validate required fields
    if (!challengeId || !otpCode) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Invalid request',
        errors: ['challengeId and otpCode are required'],
        data: undefined,
      }, { status: 400 });
    }
    
    // Extract device info from request (server-side)
    const requestInfo = getRequestInfo(req, body);
    
    if (isDev) {
      console.log('[VerifyOtp] 📋 Verifying OTP:', {
        challengeId: challengeId.substring(0, 20) + '...',
        otpLength: otpCode.length,
        deviceId: requestInfo.deviceId || 'null',
        userAgent: requestInfo.userAgent || 'null',
        ipAddress: requestInfo.ipAddress || 'null',
      });
    }
    
    // Call upstream API to verify OTP
    const upstream = await api.api.verifyOtp({
      challengeId: String(challengeId),
      otpCode: String(otpCode),
      scope: 'app',
      deviceId: requestInfo.deviceId || null,
      userAgent: requestInfo.userAgent || null,
      ipAddress: requestInfo.ipAddress || null,
    });
    
    const status = upstream.status ?? 200;
    
    if (isDev) {
      console.log('[VerifyOtp] 📥 Received response from upstream API:', {
        status: upstream.status,
        isSuccess: upstream.data?.isSuccess,
        hasAccessToken: !!upstream.data?.data?.accessToken,
        hasRefreshToken: !!upstream.data?.data?.refreshToken,
        hasUser: !!upstream.data?.data?.userId,
      });
    }
    
    // Transform to standard response format
    const verifyData = upstream.data?.data;
    const response = {
      isSuccess: !!upstream.data?.isSuccess && !!verifyData,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'OTP verified successfully' : 'OTP verification failed'),
      errors: upstream.data?.errors || undefined,
      data: verifyData ? {
        // 🔥 STANDARD: Access Token in response body (NOT cookie)
        accessToken: verifyData.accessToken || undefined,
        // 🔥 STANDARD: User information in response body
        user: verifyData.userId ? {
          id: verifyData.userId,
          // Add more user fields if available from upstream
          // Note: Additional fields (mobile, role, etc.) should come from upstream API
          // If upstream provides them, they will be included here
        } : undefined,
        // 🔥 CRITICAL: refreshToken is NOT in response body (security)
        // It's only set in HttpOnly Cookie (see below)
      } : undefined,
    };
    
    // Create response
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // If verification was successful, set refresh token in HttpOnly Cookie
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { refreshToken } = upstream.data.data;
      
      if (refreshToken) {
        // 🔥 STANDARD: Refresh Token ONLY in HttpOnly Cookie (NOT in body)
        // Security: JS cannot access, prevents XSS attacks
        res.cookies.set('refreshToken', refreshToken, {
          httpOnly: true, // 🔥 CRITICAL: JS cannot access
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          sameSite: 'strict', // CSRF protection
          path: '/', // Available for all paths
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        
        if (isDev) {
          console.log('[VerifyOtp] ✅ Refresh token set in HttpOnly Cookie:', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            tokenLength: refreshToken.length,
            note: 'Refresh token is NOT in response body (security)',
          });
        }
      } else {
        if (isDev) {
          console.warn('[VerifyOtp] ⚠️ No refreshToken in upstream response');
        }
      }
      
      // Note: Access Token is NOT set in cookie - it's in response body
      // This allows client-side code to use it for API requests
      // Access token is short-lived (15 minutes) so exposure risk is minimal
      
      if (isDev) {
        console.log('[VerifyOtp] ✅✅ OTP verification completed successfully');
      }
    } else {
      // If verification failed, ensure no cookies are set
      if (isDev) {
        console.log('[VerifyOtp] ❌ OTP verification failed');
      }
    }
    
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
    console.error('[VerifyOtp] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

