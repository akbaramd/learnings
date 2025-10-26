import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * POST /api/bills/[billId]/cancel
 * Cancel an active bill
 * Request body: { reason?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const api = createApiInstance(req);
    const { billId } = params;

    if (!billId) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const upstream = await api.api.cancelBill(billId, {
      reason: body.reason,
    });
    const status = upstream.status ?? 200;

    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Cancel bill BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return handleApiError(error as AxiosError, req);
  }
}
