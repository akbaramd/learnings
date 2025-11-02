import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetToursPaginatedResponse } from '@/src/store/tours/tours.types';
import { AxiosError } from 'axios';

/**
 * GET /api/tours
 * Get paginated list of tours
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageNumberRaw = searchParams.get('pageNumber');
    const pageSizeRaw = searchParams.get('pageSize');
    const search = searchParams.get('search') || undefined;
    const isActiveParam = searchParams.get('isActive');

    const pageNumber = Number.isFinite(Number(pageNumberRaw)) && Number(pageNumberRaw) > 0
      ? Number(pageNumberRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    const isActive =
      isActiveParam === 'true' ? true :
      isActiveParam === 'false' ? false :
      undefined;

    const upstream = await api.api.getToursPaginated({
      pageNumber,
      pageSize,
      isActive,
      search,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetToursPaginatedResponse = {
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
    console.error('[Tours] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
