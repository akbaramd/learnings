import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetFacilityCycleDetailsResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * GET /api/facilities/cycles/[cycleId]
 * Get facility cycle details by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { cycleId } = await params;

    if (!cycleId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Cycle ID is required',
        errors: ['Cycle ID is required'],
        data: null,
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const includeFacilityInfoParam = searchParams.get('includeFacilityInfo');
    const includeUserRequestHistoryParam = searchParams.get('includeUserRequestHistory');
    const includeEligibilityDetailsParam = searchParams.get('includeEligibilityDetails');
    const includeDependenciesParam = searchParams.get('includeDependencies');
    const includeStatisticsParam = searchParams.get('includeStatistics');

    const includeFacilityInfo = includeFacilityInfoParam === 'false' ? false : true;
    const includeUserRequestHistory = includeUserRequestHistoryParam === 'false' ? false : true;
    const includeEligibilityDetails = includeEligibilityDetailsParam === 'false' ? false : true;
    const includeDependencies = includeDependenciesParam === 'false' ? false : true;
    const includeStatistics = includeStatisticsParam === 'false' ? false : true;

    const upstream = await api.api.getMyFacilityCycleDetails(cycleId, {
      includeFacilityInfo,
      includeUserRequestHistory,
      includeEligibilityDetails,
      includeDependencies,
      includeStatistics,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetFacilityCycleDetailsResponse = {
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
    console.error('[Facilities] Get Cycle Detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

