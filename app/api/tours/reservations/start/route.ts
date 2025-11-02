import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { StartReservationResponse } from '@/src/store/tours/tours.types';
import { AxiosError } from 'axios';

/**
 * POST /api/tours/reservations/start
 * Start a new tour reservation
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const body = await req.json();

    if (!body.tourId || !body.capacityId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Tour ID and Capacity ID are required',
        errors: ['Tour ID and Capacity ID are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.meStartReservation({
      tourId: body.tourId,
      capacityId: body.capacityId,
    });
    
    const status = upstream.status ?? 200;

    const response: StartReservationResponse = {
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
    console.error('[Tours Reservations] Start BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

