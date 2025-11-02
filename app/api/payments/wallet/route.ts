// app/api/payments/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { PayWithWalletRequest, PayWithWalletResponseWrapper } from '@/src/store/payments';
import { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Parse request body
    const requestBody: PayWithWalletRequest = await req.json();

    // Validate required fields
    if (!requestBody.billId || !requestBody.amountRials) {
      const errorResponse: PayWithWalletResponseWrapper = {
        result: null,
        errors: ['Bill ID and amount are required']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call the upstream API to pay with wallet
    const upstream = await api.api.payWithWallet({
      billId: requestBody.billId,
      amountRials: requestBody.amountRials,
      description: requestBody.description,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend PayWithWalletResponse type
    const backendData = upstream.data?.data;
    const frontendPayment = backendData ? {
      paymentId: backendData.paymentId || '',
      billId: backendData.billId || '',
      amount: backendData.amountPaidRials || 0,
      status: backendData.paymentStatus || '',
      createdAt: backendData.processedAt || new Date().toISOString(),
      billStatus: backendData.billStatus || '',
      billTotalAmount: backendData.billRemainingAmountRials || 0,
      remainingAmount: backendData.billRemainingAmountRials || 0,
      isFullyPaid: (backendData.billRemainingAmountRials || 0) === 0,
      message: backendData.description || undefined,
    } : null;

    // Strongly typed response structure
    const response: PayWithWalletResponseWrapper = {
      result: frontendPayment,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Pay with wallet BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
