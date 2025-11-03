import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { CancelFacilityRequestResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * POST /api/facilities/requests/[requestId]/cancel
 * Cancel a facility request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Request ID is required',
        errors: ['Request ID is required'],
        data: null,
      }, { status: 400 });
    }

    const body = await req.json();
    const { reason, cancelledByUserId } = body;

    const upstream = await api.api.cancelFacilityRequest(requestId, {
      reason,
      cancelledByUserId,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: CancelFacilityRequestResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined,
    };

    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Facilities] Cancel Request BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

