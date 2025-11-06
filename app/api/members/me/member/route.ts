// app/api/members/me/member/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetCurrentMemberResponse } from '@/src/store/members/members.types';
import { AxiosError } from 'axios';

/**
 * GET /api/members/me/member
 * Get current member information
 */
export async function GET(req: NextRequest) {
  try {
    // Get API instance (uses UPSTREAM_API_BASE_URL)
    const api = createApiInstance(req);

    // Call upstream API
    const upstream = await api.api.getCurrentMember({});
    const status = upstream.status ?? 200;

    console.log('upstream', upstream.data);
    // Transform to ApplicationResult<T> format
    const response: GetCurrentMemberResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data.data,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'Member information retrieved successfully' : 'Failed to get member information'),
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.isSuccess && upstream.data.data ? (upstream.data.data as GetCurrentMemberResponse['data']) : undefined,
    };

    // Create response with headers
    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    // Forward upstream cookies
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
    console.error('[GetCurrentMember] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

