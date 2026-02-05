import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetUserReservationsResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';
import { ReservationStatus } from '@/src/services/Api';

/**
 * GET /api/hotels/reservations/accommodations/[accommodationId]/my-reservations
 * Get my reservations for a specific accommodation
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

    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status');
    const onlyActiveRaw = searchParams.get('onlyActive');
    const onlyFutureRaw = searchParams.get('onlyFuture');
    const onlyPastRaw = searchParams.get('onlyPast');

    // Validate status against ReservationStatus enum
    const validStatuses = Object.values(ReservationStatus) as string[];
    const status: ReservationStatus | undefined = statusRaw && validStatuses.includes(statusRaw)
      ? (statusRaw as ReservationStatus)
      : undefined;

    const onlyActive = onlyActiveRaw === 'true' ? true : onlyActiveRaw === 'false' ? false : undefined;
    const onlyFuture = onlyFutureRaw === 'true' ? true : onlyFutureRaw === 'false' ? false : undefined;
    const onlyPast = onlyPastRaw === 'true' ? true : onlyPastRaw === 'false' ? false : undefined;

    const upstream = await api.api.getMyReservationsForAccommodation(
      accommodationId,
      {
        status,
        onlyActive,
        onlyFuture,
        onlyPast,
      },
      {}
    );
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
    console.error('[Hotels Reservations] My Reservations BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
