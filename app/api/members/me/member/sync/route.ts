// app/api/members/me/member/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { SyncCurrentMemberResponse, SyncCurrentMemberRequest } from '@/src/store/members/members.types';
import { AxiosError } from 'axios';

/**
 * POST /api/members/me/member/sync
 * Synchronize current member from external source
 */
export async function POST(req: NextRequest) {
  try {
    // Get API instance (uses UPSTREAM_API_BASE_URL)
    const api = createApiInstance(req);

    // Parse request body
    const body: SyncCurrentMemberRequest = await req.json().catch(() => ({}));

    // Call upstream API
    const upstream = await api.api.syncCurrentMember(body);
    const status = upstream.status ?? 200;

    // Transform to ApplicationResult<T> format
    const response: SyncCurrentMemberResponse = {
      isSuccess: !!upstream.data?.isSuccess && !!upstream.data.data,
      message: upstream.data?.message || (upstream.data?.isSuccess ? 'Member synchronized successfully' : 'Failed to synchronize member'),
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.isSuccess && upstream.data.data ? (upstream.data.data as SyncCurrentMemberResponse['data']) : undefined,
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
    console.error('[SyncCurrentMember] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

