import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationsPaginatedResponse, GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
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

    // Support both 'page' and 'pageNumber' for compatibility
    const pageRaw = searchParams.get('page') || searchParams.get('pageNumber');
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

    // Validate and parse pagination parameters
    const page = Number.isFinite(Number(pageRaw)) && Number(pageRaw) > 0
      ? Number(pageRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0 && Number(pageSizeRaw) <= 100
      ? Number(pageSizeRaw)
      : 10;

    // Validate status against ReservationStatus enum
    // Support both lowercase and uppercase status values (e.g., "pending" -> "Pending")
    const validStatuses = Object.values(ReservationStatus) as string[];
    let status: ReservationStatus | undefined = undefined;
    
    if (statusRaw) {
      // Try exact match first (uppercase)
      if (validStatuses.includes(statusRaw as ReservationStatus)) {
        status = statusRaw as ReservationStatus;
      } else {
        // Try case-insensitive match (convert lowercase to proper case)
        const normalized = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase();
        if (validStatuses.includes(normalized as ReservationStatus)) {
          status = normalized as ReservationStatus;
        }
      }
    }

    // Validate and parse price filters
    const minPriceRials = minPriceRialsRaw && Number.isFinite(Number(minPriceRialsRaw)) && Number(minPriceRialsRaw) >= 0
      ? Number(minPriceRialsRaw)
      : undefined;

    const maxPriceRials = maxPriceRialsRaw && Number.isFinite(Number(maxPriceRialsRaw)) && Number(maxPriceRialsRaw) >= 0
      ? Number(maxPriceRialsRaw)
      : undefined;

    // Validate price range
    if (minPriceRials !== undefined && maxPriceRials !== undefined && minPriceRials > maxPriceRials) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Minimum price cannot be greater than maximum price',
        errors: ['Minimum price cannot be greater than maximum price'],
        data: null,
      }, { status: 400 });
    }

    // Call upstream API with pagination and filters
    const upstream = await api.api.getReservationsPaginated({
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

    // Transform GetReservationsPaginatedResultApplicationResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: GetReservationsPaginatedResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.data,
      message: serviceResult?.message || 'Reservations retrieved successfully',
      errors: serviceResult?.errors || undefined,
      data: serviceResult?.data || undefined
    };

    const res = NextResponse.json(response, { status: statusCode });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    // Forward upstream cookies
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Hotels Reservations] Get paginated BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

