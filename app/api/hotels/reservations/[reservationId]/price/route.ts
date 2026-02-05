import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationPricingResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * GET /api/hotels/reservations/[reservationId]/price
 * Calculate price for a hotel reservation
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

    const upstream = await api.api.calculatePrice(reservationId, {});
    const status = upstream.status ?? 200;

    // Transform ReservationPricingDtoServiceResult to ApplicationResult format
    const serviceResult = upstream.data;
    const response: GetReservationPricingResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.value,
      message: serviceResult?.message || 'Price calculated successfully',
      errors: serviceResult?.errors?.map(e => e.message || e.code || 'Unknown error') || undefined,
      data: serviceResult?.value ? {
        reservationId: serviceResult.value.reservationId,
        totalAmountRials: serviceResult.value.totalAmountRials,
        dailyPrices: serviceResult.value.dailyPrices || undefined,
      } : undefined,
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
    console.error('[Hotels Reservations] Calculate Price BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
