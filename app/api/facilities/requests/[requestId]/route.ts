import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetFacilityRequestDetailsResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * GET /api/facilities/requests/[requestId]
 * Get facility request details by ID
 */
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const includeFacilityParam = searchParams.get('includeFacility');
    const includeCycleParam = searchParams.get('includeCycle');
    const includePolicySnapshotParam = searchParams.get('includePolicySnapshot');

    const includeFacility = includeFacilityParam === 'false' ? false : true;
    const includeCycle = includeCycleParam === 'false' ? false : true;
    const includePolicySnapshot = includePolicySnapshotParam === 'false' ? false : true;

    const upstream = await api.api.getMyFacilityRequestDetails(requestId, {
      includeFacility,
      includeCycle,
      includePolicySnapshot,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetFacilityRequestDetailsResponse = {
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
    console.error('[Facilities] Get Request Detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

