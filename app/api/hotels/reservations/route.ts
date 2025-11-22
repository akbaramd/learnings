import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationsPaginatedResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';
import { ReservationStatus } from '@/src/services/Api';

/**
 * GET /api/hotels/reservations
 * Get paginated list of reservations
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const statusRaw = searchParams.get('status');
    const accommodationId = searchParams.get('accommodationId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;
    const externalUserId = searchParams.get('externalUserId') || undefined;
    const checkInDateFrom = searchParams.get('checkInDateFrom') || undefined;
    const checkInDateTo = searchParams.get('checkInDateTo') || undefined;
    const checkOutDateFrom = searchParams.get('checkOutDateFrom') || undefined;
    const checkOutDateTo = searchParams.get('checkOutDateTo') || undefined;
    const reservationDateFrom = searchParams.get('reservationDateFrom') || undefined;
    const reservationDateTo = searchParams.get('reservationDateTo') || undefined;
    const minPriceRialsRaw = searchParams.get('minPriceRials');
    const maxPriceRialsRaw = searchParams.get('maxPriceRials');

    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    // Validate status against ReservationStatus enum
    const validStatuses = Object.values(ReservationStatus) as string[];
    const status: ReservationStatus | undefined = statusRaw && validStatuses.includes(statusRaw)
      ? (statusRaw as ReservationStatus)
      : undefined;

    const minPriceRials = minPriceRialsRaw && Number.isFinite(Number(minPriceRialsRaw))
      ? Number(minPriceRialsRaw)
      : undefined;

    const maxPriceRials = maxPriceRialsRaw && Number.isFinite(Number(maxPriceRialsRaw))
      ? Number(maxPriceRialsRaw)
      : undefined;

    const upstream = await api.api.hotelsGetReservationsPaginated({
      page,
      pageSize,
      searchTerm,
      status,
      accommodationId,
      roomId,
      externalUserId,
      checkInDateFrom,
      checkInDateTo,
      checkOutDateFrom,
      checkOutDateTo,
      reservationDateFrom,
      reservationDateTo,
      minPriceRials,
      maxPriceRials,
    }, {});

    const statusCode = upstream.status ?? 200;

    const response: GetReservationsPaginatedResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined
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
    console.error('[Hotels Reservations] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

