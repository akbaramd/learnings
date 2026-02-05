import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetReservationDetailResponse } from '@/src/store/accommodations/accommodations.types';
import { AxiosError } from 'axios';

/**
 * POST /api/hotels/reservations/create
 * Create a new hotel reservation
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const body = await req.json();

    if (!body.roomId || !body.checkInDate || !body.checkOutDate) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Room ID, check-in date, and check-out date are required',
        errors: ['Room ID, check-in date, and check-out date are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.createReservation({
      roomId: body.roomId,
      checkInDate: body.checkInDate,
      checkOutDate: body.checkOutDate,
      memberId: body.memberId || undefined,
      notes: body.notes || undefined,
      tenantId: body.tenantId || undefined,
    }, {});
    
    const status = upstream.status ?? 200;

    // Transform ReservationDetailsDtoServiceResult to ApplicationResult format
    const serviceResult = upstream.data;
    
    // Log response for debugging
    console.log('[Hotels Reservations] Create upstream response:', {
      status,
      serviceResult: JSON.stringify(serviceResult, null, 2),
      hasValue: !!serviceResult?.value,
      isSuccess: !!serviceResult?.isSuccess,
      errors: serviceResult?.errors,
      message: serviceResult?.message,
    });

    const response: GetReservationDetailResponse = {
      isSuccess: !!serviceResult?.isSuccess && !!serviceResult?.value,
      message: serviceResult?.message || 'Reservation created successfully',
      errors: serviceResult?.errors?.map(e => e.message || e.code || 'Unknown error') || undefined,
      data: serviceResult?.value || undefined,
    };

    // Log final response
    console.log('[Hotels Reservations] Create final response:', {
      isSuccess: response.isSuccess,
      message: response.message,
      errors: response.errors,
      hasData: !!response.data,
      reservationId: response.data?.id,
    });

    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Hotels Reservations] Create BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    // Log detailed error information
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;
      console.error('[Hotels Reservations] Create error response:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: JSON.stringify(axiosError.response?.data, null, 2),
        headers: axiosError.response?.headers,
      });
    }

    return handleApiError(error as AxiosError);
  }
}
