import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetUserReservationsResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';
import { ReservationStatus } from '@/src/services/Api';

/**
 * GET /api/hotels/reservations/user/me
 * Get current user's reservations
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const accommodationId = searchParams.get('accommodationId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const statusRaw = searchParams.get('status');
    const onlyActiveParam = searchParams.get('onlyActive');
    const onlyFutureParam = searchParams.get('onlyFuture');
    const onlyPastParam = searchParams.get('onlyPast');

    // Validate status against ReservationStatus enum
    const validStatuses = Object.values(ReservationStatus) as string[];
    const status: ReservationStatus | undefined = statusRaw && validStatuses.includes(statusRaw)
      ? (statusRaw as ReservationStatus)
      : undefined;

    const onlyActive = onlyActiveParam === 'true' ? true :
      onlyActiveParam === 'false' ? false :
      undefined;

    const onlyFuture = onlyFutureParam === 'true' ? true :
      onlyFutureParam === 'false' ? false :
      undefined;

    const onlyPast = onlyPastParam === 'true' ? true :
      onlyPastParam === 'false' ? false :
      undefined;

    const upstream = await api.api.hotelsGetUserReservations({
      accommodationId,
      roomId,
      status,
      onlyActive,
      onlyFuture,
      onlyPast,
    }, {});

    const statusCode = upstream.status ?? 200;

    const response: GetUserReservationsResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined,
    };

    const res = NextResponse.json(response, { status: statusCode });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Hotels Reservations] Get User Reservations BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

