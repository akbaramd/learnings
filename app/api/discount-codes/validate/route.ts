// app/api/discount-codes/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AxiosError } from 'axios';

/**
 * POST /api/discount-codes/validate
 * Validate a discount code for a bill
 * Request body: { billId: string, discountCode: string }
 * Returns: ApplicationResult<ValidateDiscountCodeResponse>
 */
export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Parse request body
    const requestBody = await req.json();

    // Validate required fields
    if (!requestBody.billId || !requestBody.discountCode) {
      return NextResponse.json(
        {
          isSuccess: false,
          message: 'Bill ID and discount code are required',
          errors: ['Bill ID and discount code are required'],
          data: null,
        },
        { status: 400 }
      );
    }

    // Call the upstream API to validate discount code
    const upstream = await api.api.validateDiscountCodeForUser(
      requestBody.billId,
      requestBody.discountCode,
      { externalUserId: '' }, // This might need to be adjusted based on actual API
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
