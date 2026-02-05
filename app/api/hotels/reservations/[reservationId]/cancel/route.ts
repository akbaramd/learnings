import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * POST /api/hotels/reservations/[reservationId]/cancel
 * Cancel a hotel reservation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { reservationId } = await params;

    if (!reservationId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Reservation ID is required',
        errors: ['Reservation ID is required'],
        data: null,
      }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || undefined;

    const upstream = await api.api.cancelReservation(
      reservationId,
      { reason },
      {}
    );
    const status = upstream.status ?? 200;

    // Transform ReservationDetailsDtoServiceResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: GetReservationDetailResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.value,
      message: serviceResult?.message || 'Reservation cancelled successfully',
      errors: serviceResult?.errors?.map(e => {
        if (typeof e === 'string') return e;
        if (typeof e === 'object' && e !== null) {
          const errorObj = e as { message?: string; code?: string };
          return errorObj.message || errorObj.code || 'Unknown error';
        }
        return String(e);
      }) || undefined,
      data: serviceResult?.value || undefined,
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
    console.error('[Hotels] Cancel reservation BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
