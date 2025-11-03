// app/api/payments/[paymentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetPaymentDetailWrapper } from '@/src/store/payments';
import { AxiosError } from 'axios';

/**
 * GET /api/payments/[paymentId]
 * Get payment detail by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const resolvedParams = await params;

    // Validate paymentId parameter
    if (!resolvedParams.paymentId || typeof resolvedParams.paymentId !== 'string') {
      const errorResponse: GetPaymentDetailWrapper = {
        result: undefined,
        errors: ['Invalid payment ID']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call the upstream API
    const upstream = await api.api.meGetPaymentDetail(resolvedParams.paymentId, {});

    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetPaymentDetailWrapper = {
      result: upstream?.data?.data,
      errors: status !== 200 ? ['Failed to get payment detail'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control for sensitive data
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }
    
    return res;
  } catch (error) {
    console.error('[PaymentDetail] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError);
  }
}
