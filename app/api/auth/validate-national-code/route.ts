// app/api/auth/validate-national-code/route.ts (Server-only)
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { ValidateNationalCodeResponse } from '@/src/store/auth/auth.types';
import { AxiosError } from 'axios';

/**
 * POST /api/auth/validate-national-code
 * Validates a national code format and checks if a member exists with this national code
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
        data: null
      }, { status: 400 });
    }
    
    // Call upstream API
    const upstream = await api.api.validateNationalCode({ nationalCode });
    const status = upstream.status ?? 200;
    
    // Transform to ApplicationResult<T>
    const response: ValidateNationalCodeResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data?.data,
      message: upstream.data?.message || 'National code validation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data ? {
        nationalCode: upstream.data.data.nationalCode || null,
        isValidFormat: upstream.data.data.isValidFormat ?? undefined,
        exists: upstream.data.data.exists ?? undefined,
        fullName: upstream.data.data.fullName || null,
        membershipNumber: upstream.data.data.membershipNumber || null
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
    console.error('[ValidateNationalCode] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}

