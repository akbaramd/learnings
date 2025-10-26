import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * GET /api/bills/me
 * Get paginated list of bills for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const searchParams = req.nextUrl.searchParams;

    const upstream = await api.api.getMyBills(
      {},
      {
        pageNumber: parseInt(searchParams.get('pageNumber') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        status: searchParams.get('status') || undefined,
        billType: searchParams.get('billType') || undefined,
        onlyOverdue: searchParams.get('onlyOverdue') === 'true',
        onlyUnpaid: searchParams.get('onlyUnpaid') === 'true',
        sortBy: searchParams.get('sortBy') || 'IssueDate',
        sortDirection: searchParams.get('sortDirection') || 'desc',
      }
    );

    const status = upstream.status ?? 200;
    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Get my bills BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    return handleApiError(error as AxiosError, req);
  }
}
