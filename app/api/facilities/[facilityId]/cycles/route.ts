import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetFacilityCyclesResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * GET /api/facilities/[facilityId]/cycles
 * Get paginated list of facility cycles
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { facilityId } = await params;

    if (!facilityId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Facility ID is required',
        errors: ['Facility ID is required'],
        data: null,
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);

    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');
    const status = searchParams.get('status') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const onlyActiveParam = searchParams.get('onlyActive');
    const onlyEligibleParam = searchParams.get('onlyEligible');
    const onlyWithUserRequestsParam = searchParams.get('onlyWithUserRequests');
    const includeUserRequestStatusParam = searchParams.get('includeUserRequestStatus');
    const includeDetailedRequestInfoParam = searchParams.get('includeDetailedRequestInfo');
    const includeStatisticsParam = searchParams.get('includeStatistics');

    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    const onlyActive = onlyActiveParam === 'false' ? false : false;
    const onlyEligible = onlyEligibleParam === 'true' ? true : false;
    const onlyWithUserRequests = onlyWithUserRequestsParam === 'true' ? true : false;
    const includeUserRequestStatus = includeUserRequestStatusParam === 'false' ? false : true;
    const includeDetailedRequestInfo = includeDetailedRequestInfoParam === 'true' ? true : false;
    const includeStatistics = includeStatisticsParam === 'false' ? false : true;

    const upstream = await api.api.getFacilityCyclesWithUser(facilityId, {
      page,
      pageSize,
      status,
      searchTerm,
      onlyActive,
      onlyEligible,
      onlyWithUserRequests,
      includeUserRequestStatus,
      includeDetailedRequestInfo,
      includeStatistics,
    }, {});
    
    const statusCode = upstream.status ?? 200;

    const response: GetFacilityCyclesResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined
    };

    const res = NextResponse.json(response, { status: statusCode });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Facilities] Get Cycles BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

