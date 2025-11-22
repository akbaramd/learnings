import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetRoomReservationsInDateRangeResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * GET /api/hotels/reservations/rooms/[roomId]/calendar
 * Get room reservations in date range (calendar view)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);

    if (!roomId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Room ID is required',
        errors: ['Room ID is required'],
        data: null,
      }, { status: 400 });
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const onlyActiveParam = searchParams.get('onlyActive');

    if (!startDate || !endDate) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Start date and end date are required',
        errors: ['Start date and end date are required'],
        data: null,
      }, { status: 400 });
    }

    const onlyActive = onlyActiveParam === 'false' ? false : true;

    const upstream = await api.api.hotelsGetRoomReservationsInDateRange(
      roomId,
      {
        startDate,
        endDate,
        onlyActive,
      },
      {}
    );

    const status = upstream.status ?? 200;

    const response: GetRoomReservationsInDateRangeResponse = {
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
    console.error('[Hotels Reservations] Get Room Calendar BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

