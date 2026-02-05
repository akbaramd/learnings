import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * POST /api/hotels/reservations/[reservationId]/revert
 * Revert a reservation from Submitted to Pending status
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

    const upstream = await api.api.revertReservation(reservationId, {});
    const status = upstream.status ?? 200;

    // Transform ReservationDetailsDtoServiceResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: GetReservationDetailResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.value,
      message: serviceResult?.message || 'Reservation reverted successfully',
      errors: serviceResult?.errors?.map(e => e.message || e.code || 'Unknown error') || undefined,
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
    console.error('[Hotels] Revert reservation BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
