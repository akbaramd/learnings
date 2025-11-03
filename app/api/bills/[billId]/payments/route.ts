// app/api/bills/[billId]/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetPaymentsPaginatedResponse } from '@/src/store/payments';
import { AxiosError } from 'axios';

/**
 * GET /api/bills/[billId]/payments
 * Get paginated list of payments for a specific bill
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const resolvedParams = await params;
    const { searchParams } = new URL(req.url);

    if (!resolvedParams.billId) {
      return NextResponse.json(
        {
          isSuccess: false,
          message: 'Bill ID is required',
          errors: ['Bill ID is required'],
          data: null,
        },
        { status: 400 }
      );
    }

    const pageNumberRaw = searchParams.get('pageNumber');
    const pageSizeRaw = searchParams.get('pageSize');
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const sortByRaw = searchParams.get('sortBy');
    const sortBy = sortByRaw && ['id', 'issuedate', 'duedate', 'amount', 'status'].includes(sortByRaw)
      ? sortByRaw
      : 'issuedate'; // Default to issuedate if invalid or missing
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    const pageNumber = Number.isFinite(Number(pageNumberRaw)) && Number(pageNumberRaw) > 0
      ? Number(pageNumberRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 10;

    const upstream = await api.api.getBillPayments(
      resolvedParams.billId,
      {
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
        searchTerm,
      },
      {}
    );

    const statusCode = upstream.status ?? 200;

    // Check if upstream returned an error about invalid sort field
    if (upstream.data?.errors && upstream.data.errors.length > 0) {
      const hasInvalidSortError = upstream.data.errors.some(
        (err: string) => err.includes('مرتب') || err.includes('فیلد') || err.includes('sort')
      );
      
      if (hasInvalidSortError && sortByRaw && !['id', 'issuedate', 'duedate', 'amount', 'status'].includes(sortByRaw)) {
        // If invalid sort field was provided, retry with default
        console.warn(`[BillPayments] Invalid sort field "${sortByRaw}", retrying with "issuedate"`);
        const retryUpstream = await api.api.getBillPayments(
          resolvedParams.billId,
          {
            pageNumber,
            pageSize,
            sortBy: 'issuedate',
            sortDirection,
            searchTerm,
          },
          {}
        );
        
        const retryStatusCode = retryUpstream.status ?? 200;
        const retryResponse: GetPaymentsPaginatedResponse = {
          isSuccess: !!retryUpstream.data?.data,
          message: retryUpstream.data?.message || 'Operation completed',
          errors: retryUpstream.data?.errors || undefined,
          data: retryUpstream.data?.data || undefined
        };
        
        const retryRes = NextResponse.json(retryResponse, { status: retryStatusCode });
        retryRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        
        const retrySetCookie = retryUpstream.headers?.['set-cookie'];
        if (retrySetCookie) {
          if (Array.isArray(retrySetCookie)) retrySetCookie.forEach(c => retryRes.headers.append('set-cookie', c));
          else retryRes.headers.set('set-cookie', retrySetCookie as string);
        }
        
        return retryRes;
      }
    }

    const response: GetPaymentsPaginatedResponse = {
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
    console.error('[BillPayments] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

