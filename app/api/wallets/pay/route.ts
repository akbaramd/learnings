// app/api/wallets/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { PayWithWalletResponseWrapper } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    const body = await req.json();

    // Call the upstream API to pay with wallet
    const upstream = await api.api.payWithWallet(body);
    const status = upstream.status ?? 200;

    // Map backend response to frontend PayWithWalletResponse type
    const backendData = upstream.data?.data;
    const frontendPayment = backendData ? {
      paymentId: backendData.paymentId || '',
      walletId: backendData.billId || '',
      amount: backendData.amountPaidRials || 0,
      billRemainingAmount: backendData.billRemainingAmountRials || 0,
      walletBalanceAfter: backendData.walletBalanceAfterPaymentRials || 0,
      transactionId: backendData.paymentId || '',
      description: `Payment for bill ${backendData.billNumber}`,
      reference: backendData.billNumber || '',
      processedAt: new Date().toISOString(),
      metadata: {
        paymentStatus: backendData.paymentStatus || '',
        paymentStatusText: backendData.paymentStatusText || '',
        billStatus: backendData.billStatus || '',
        billStatusText: backendData.billStatusText || '',
      },
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
