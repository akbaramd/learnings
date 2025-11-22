import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { StartReservationResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * POST /api/hotels/reservations/start
 * Start a new hotel reservation
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const body = await req.json();

    if (!body.roomId || !body.checkInDate || !body.checkOutDate || body.guestCount === undefined) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Room ID, check-in date, check-out date, and guest count are required',
        errors: ['Room ID, check-in date, check-out date, and guest count are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.hotelsStartReservation({
      roomId: body.roomId,
      checkInDate: body.checkInDate,
      checkOutDate: body.checkOutDate,
      guestCount: body.guestCount,
      notes: body.notes || undefined,
    }, {});
    
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
    console.error('[Hotels Reservations] Start BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

