// app/api/wallets/deposit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { CreateDepositResponseWrapper } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function POST(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    const body = await req.json();

    // Call the upstream API to create wallet deposit
    const upstream = await api.api.createWalletDeposit({
      amountRials: body.amount,
      description: body.description,
      metadata: body.metadata,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend CreateDepositResponse type
    const backendData = upstream.data?.data;

    console.log('upstream.data', upstream.data);
    const frontendDeposit = backendData ? {
      id: backendData.depositId || '',
      walletId: backendData.billId || '',
      trackingCode: backendData.billNumber || '',
      amount: backendData.amountRials || 0,
      status: 'Completed' as const,
      description: `Deposit for bill ${backendData.billNumber}`,
      createdAt: new Date().toISOString(),
      metadata: {
        userExternalUserId: backendData.userExternalUserId || '',
        userFullName: backendData.userFullName || '',
      },
    } : null;

    // Strongly typed response structure
    const response: CreateDepositResponseWrapper = {
      result: frontendDeposit,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Create wallet deposit BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}
