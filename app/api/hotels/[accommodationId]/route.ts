import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetAccommodationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * GET /api/hotels/[accommodationId]
 * Get accommodation details by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accommodationId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { accommodationId } = await params;

    if (!accommodationId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Accommodation ID is required',
        errors: ['Accommodation ID is required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.hotelsGetAccommodationDetails(accommodationId, {});
    
    const status = upstream.status ?? 200;

    const response: GetAccommodationDetailResponse = {
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
    console.error('[Hotels] Get Accommodation Detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

