import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { DeleteReservationResponse, GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * GET /api/hotels/reservations/[reservationId]
 * Get reservation details
 */
export async function GET(
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

    const upstream = await api.api.getReservationDetails(reservationId, {});
    const status = upstream.status ?? 200;

    // Transform ReservationDetailsDtoApplicationResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: GetReservationDetailResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.data,
      message: serviceResult?.message || 'Operation completed',
      errors: serviceResult?.errors || undefined,
      data: serviceResult?.data || undefined,
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
    console.error('[Hotels] Get reservation detail BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

/**
 * DELETE /api/hotels/reservations/[reservationId]
 * Delete a reservation
 */
export async function DELETE(
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

    const upstream = await api.api.deleteReservation(reservationId, {});
    const status = upstream.status ?? 200;

    // Transform ServiceResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: DeleteReservationResponse = {
      isSuccess: !!serviceResult?.isSuccess,
      message: serviceResult?.message || 'Reservation deleted successfully',
      errors: serviceResult?.errors?.map(e => e.message || e.code || 'Unknown error') || undefined,
      data: undefined,
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
    console.error('[Hotels] Delete reservation BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
