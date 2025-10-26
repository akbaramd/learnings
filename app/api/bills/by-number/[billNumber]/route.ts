import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * GET /api/bills/by-number/[billNumber]
 * Get bill details by bill number
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { billNumber: string } }
) {
  try {
    const api = createApiInstance(req);
    const { billNumber } = params;

    if (!billNumber) {
      return NextResponse.json(
        { error: 'Bill number is required' },
        { status: 400 }
      );
    }

    const upstream = await api.api.getBillDetailsByNumber(billNumber, {});
    const status = upstream.status ?? 200;

    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Get bill details by number BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return handleApiError(error as AxiosError, req);
  }
}
