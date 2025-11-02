import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * GET /api/bills/me/[billId]/discount-codes/[code]/validation
 * Validate a discount code for a specific user's bill
 * Query parameters:
 *   - externalUserId: string (required) - The user ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string; code: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { billId, code } = await params;
    const searchParams = req.nextUrl.searchParams;

    if (!billId) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    const externalUserId = searchParams.get('externalUserId');
    if (!externalUserId) {
      return NextResponse.json(
        { error: 'externalUserId is required as query parameter' },
        { status: 400 }
      );
    }

    const upstream = await api.api.validateDiscountCodeForUser(
      billId,
      code,
      { externalUserId },
      {}
    );
    const status = upstream.status ?? 200;

    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Validate discount code BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return handleApiError(error as AxiosError);
  }
}
