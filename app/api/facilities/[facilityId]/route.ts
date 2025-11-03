import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetFacilityDetailsResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * GET /api/facilities/[facilityId]
 * Get facility details by ID
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
    const includeCyclesParam = searchParams.get('includeCycles');
    const includeFeaturesParam = searchParams.get('includeFeatures');
    const includePoliciesParam = searchParams.get('includePolicies');
    const includeUserRequestHistoryParam = searchParams.get('includeUserRequestHistory');

    const includeCycles = includeCyclesParam === 'false' ? false : true;
    const includeFeatures = includeFeaturesParam === 'false' ? false : true;
    const includePolicies = includePoliciesParam === 'false' ? false : true;
    const includeUserRequestHistory = includeUserRequestHistoryParam === 'true' ? true : false;

    const upstream = await api.api.getFacilityDetails(facilityId, {
      includeCycles,
      includeFeatures,
      includePolicies,
      includeUserRequestHistory,
    });
    
    const status = upstream.status ?? 200;

    const response: GetFacilityDetailsResponse = {
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
    console.error('[Facilities] Get Facility Detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

