import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetFacilityRequestsResponse, CreateFacilityRequestResponse } from '@/src/store/facilities/facilities.types';
import { AxiosError } from 'axios';

/**
 * GET /api/facilities/requests
 * Get paginated list of facility requests
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageRaw = searchParams.get('page') || searchParams.get('pageNumber');
    const pageSizeRaw = searchParams.get('pageSize');
    const facilityId = searchParams.get('facilityId') || undefined;
    const facilityCycleId = searchParams.get('facilityCycleId') || searchParams.get('cycleId') || undefined;
    const status = searchParams.get('status') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('fromDate') || undefined;
    const dateTo = searchParams.get('dateTo') || searchParams.get('toDate') || undefined;

    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    const upstream = await api.api.getFacilityRequestsByUser({
      page,
      pageSize,
      facilityId,
      facilityCycleId,
      status,
      searchTerm,
      dateFrom,
      dateTo,
    }, {});
    
    const statusCode = upstream.status ?? 200;

    const response: GetFacilityRequestsResponse = {
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
    console.error('[Facilities] Get Requests BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

/**
 * POST /api/facilities/requests
 * Create a new facility request
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const body = await req.json();

    const { facilityCycleId, priceOptionId, description, metadata, idempotencyKey } = body;

    // Validate required fields
    if (!facilityCycleId || !priceOptionId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Facility cycle ID and price option ID are required',
        errors: ['Facility cycle ID and price option ID are required'],
        data: null,
      }, { status: 400 });
    }

    // Build request payload - only include defined values
    const requestPayload: {
      facilityCycleId: string;
      priceOptionId: string;
      description?: string | null;
      metadata?: Record<string, string>;
      idempotencyKey?: string | null;
    } = {
      facilityCycleId,
      priceOptionId,
    };

    // Add optional fields only if provided
    if (description !== undefined && description !== null) {
      requestPayload.description = description;
    }
    if (metadata !== undefined && metadata !== null) {
      requestPayload.metadata = metadata;
    }
    if (idempotencyKey !== undefined && idempotencyKey !== null) {
      requestPayload.idempotencyKey = idempotencyKey;
    }

    const upstream = await api.api.createFacilityRequest(requestPayload, {});
    
    const status = upstream.status ?? 200;

    const response: CreateFacilityRequestResponse = {
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
    console.error('[Facilities] Create Request BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

