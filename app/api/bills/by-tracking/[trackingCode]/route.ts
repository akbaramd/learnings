import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * GET /api/bills/by-tracking/[trackingCode]
 * Get bill details by tracking code
 * Query parameters:
 *   - billType: string (required) - The type of bill
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const api = createApiInstance(req);
    const { trackingCode } = params;
    const searchParams = req.nextUrl.searchParams;

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'Tracking code is required' },
        { status: 400 }
      );
    }

    const billType = searchParams.get('billType');
    if (!billType) {
      return NextResponse.json(
        { error: 'Bill type is required as query parameter' },
        { status: 400 }
      );
    }

    const upstream = await api.api.getBillDetailsByTrackingCode(
      trackingCode,
      billType,
      {}
    );
    const status = upstream.status ?? 200;

    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Get bill details by tracking code BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return handleApiError(error as AxiosError, req);
  }
}
