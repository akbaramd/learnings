import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { RemoveGuestFromReservationResponseWrapper } from '@/src/store/tours/tours.types';
import { AxiosError } from 'axios';

/**
 * DELETE /api/tours/reservations/[reservationId]/guests/[participantId]
 * Remove a guest from reservation
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reservationId: string; participantId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { reservationId, participantId } = await params;

    if (!reservationId || !participantId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Reservation ID and Participant ID are required',
        errors: ['Reservation ID and Participant ID are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.meRemoveGuestFromReservation(reservationId, participantId);
    const status = upstream.status ?? 200;

    const response: RemoveGuestFromReservationResponseWrapper = {
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
    console.error('[Tours Reservations] Remove Guest BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

