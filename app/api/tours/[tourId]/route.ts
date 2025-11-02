import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetTourDetailResponse } from '@/src/store/tours/tours.types';
import { AxiosError } from 'axios';

/**
 * GET /api/tours/[tourId]
 * Get tour details by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { tourId } = await params;

    if (!tourId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Tour ID is required',
        errors: ['Tour ID is required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.getTourDetails(tourId, {});
    
    const status = upstream.status ?? 200;

    const response: GetTourDetailResponse = {
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
    console.error('[Tours] Get Tour Detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

