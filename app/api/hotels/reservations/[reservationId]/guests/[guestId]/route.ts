import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * DELETE /api/hotels/reservations/[reservationId]/guests/[guestId]
 * Remove a guest from reservation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reservationId: string; guestId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { reservationId, guestId } = await params;

    // Log incoming request
    console.log('[Hotels Reservations] Remove Guest - Request:', {
      reservationId,
      guestId,
    });

    if (!reservationId || !guestId) {
      console.error('[Hotels Reservations] Remove Guest - Missing IDs:', {
        hasReservationId: !!reservationId,
        hasGuestId: !!guestId,
      });
      return NextResponse.json({
        isSuccess: false,
        message: 'Reservation ID and Guest ID are required',
        errors: ['Reservation ID and Guest ID are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.removeGuest(reservationId, guestId, {});
    const status = upstream.status ?? 200;

    // Transform ReservationDetailsDtoServiceResult to ApplicationResult format
    const serviceResult = upstream.data;

    // Log upstream response
    console.log('[Hotels Reservations] Remove Guest - Upstream response:', {
      status,
      serviceResult: JSON.stringify(serviceResult, null, 2),
      hasValue: !!serviceResult?.value,
      isSuccess: !!serviceResult?.isSuccess,
      errors: serviceResult?.errors,
      message: serviceResult?.message,
    });

    const response: GetReservationDetailResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.value,
      message: serviceResult?.message || 'Guest removed successfully',
      errors: serviceResult?.errors?.map(e => e.message || e.code || 'Unknown error') || undefined,
      data: serviceResult?.value || undefined,
    };

    // Log final response
    console.log('[Hotels Reservations] Remove Guest - Final response:', {
      isSuccess: response.isSuccess,
      message: response.message,
      errors: response.errors,
      hasData: !!response.data,
    });

    if (!response.isSuccess) {
      console.error('[Hotels Reservations] Remove Guest - Response Error:', {
        status: upstream.status,
        serviceResult: serviceResult,
        response: response,
      });
    }

    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Hotels Reservations] Remove Guest BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    // Log detailed error information
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      console.error('[Hotels Reservations] Remove Guest error response:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: JSON.stringify(axiosError.response?.data, null, 2),
        headers: axiosError.response?.headers,
      });
    }

    return handleApiError(error as AxiosError);
  }
}
