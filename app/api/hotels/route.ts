import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetAccommodationsPaginatedResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';
import { AccommodationType } from '@/src/services/Api';

/**
 * GET /api/hotels
 * Get paginated list of accommodations
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const typeRaw = searchParams.get('type');
    const isActiveParam = searchParams.get('isActive');
    const provinceId = searchParams.get('provinceId') || undefined;
    const cityId = searchParams.get('cityId') || undefined;
    const featureIds = searchParams.getAll('featureIds');
    const minPriceRialsRaw = searchParams.get('minPriceRials');
    const maxPriceRialsRaw = searchParams.get('maxPriceRials');

    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    const isActive =
      isActiveParam === 'true' ? true :
      isActiveParam === 'false' ? false :
      undefined;

    // Validate type against AccommodationType enum
    const validTypes = Object.values(AccommodationType) as string[];
    const type: AccommodationType | undefined = typeRaw && validTypes.includes(typeRaw)
      ? (typeRaw as AccommodationType)
      : undefined;

    const minPriceRials = minPriceRialsRaw && Number.isFinite(Number(minPriceRialsRaw))
      ? Number(minPriceRialsRaw)
      : undefined;

    const maxPriceRials = maxPriceRialsRaw && Number.isFinite(Number(maxPriceRialsRaw))
      ? Number(maxPriceRialsRaw)
      : undefined;

    const featureIdsArray = featureIds.length > 0 ? featureIds : undefined;

    const upstream = await api.api.hotelsGetAccommodationsPaginated({
      page,
      pageSize,
      searchTerm,
      type,
      isActive,
      provinceId,
      cityId,
      featureIds: featureIdsArray,
      minPriceRials,
      maxPriceRials,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetAccommodationsPaginatedResponse = {
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
    console.error('[Hotels] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

