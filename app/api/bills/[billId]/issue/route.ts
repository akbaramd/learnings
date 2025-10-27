import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * POST /api/bills/[billId]/issue
 * Issue a bill (transition from draft to issued state)
 * Request body: { autoIssueBill?: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { billId } = await params;

    if (!billId) {
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

    const body = await req.json().catch(() => ({}));

    const upstream = await api.api.issueBill(billId, {
      autoIssueBill: body.autoIssueBill,
    });
    const status = upstream.status ?? 200;

    return NextResponse.json(upstream.data, { status });
  } catch (error) {
    console.error('Issue bill BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    // Handle AxiosError with response
    if (error instanceof AxiosError && error.response) {
      const errorData = error.response.data;
      const errorMessage = typeof errorData === 'object' 
        ? errorData?.message || error.message 
        : error.response.statusText || error.message;
      const errorArray = typeof errorData === 'object' && Array.isArray(errorData?.errors)
        ? errorData.errors
        : [errorMessage];

      return NextResponse.json(
        {
          isSuccess: false,
          message: errorMessage,
          errors: errorArray,
          data: null,
        },
        { status: error.response.status }
      );
    }

    // Handle AxiosError without response (network error)
    if (error instanceof AxiosError) {
      return NextResponse.json(
        {
          isSuccess: false,
          message: error.message || 'Network error',
          errors: [error.message || 'Network error'],
          data: null,
        },
        { status: 503 }
      );
    }
    
    // Handle generic errors
    return NextResponse.json(
      {
        isSuccess: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        data: null,
      },
      { status: 500 }
    );
  }
}
