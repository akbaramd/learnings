// app/api/wallets/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetWalletResponse } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // Call the upstream API to get wallet balance
    const upstream = await api.api.getWalletBalance();
    const status = upstream.status ?? 200;

    // Map backend response to frontend Wallet type
    const backendData = upstream.data?.data;
    const frontendWallet = backendData ? {
      id: backendData.walletId || '',
      userId: backendData.userExternalUserId || '',
      userName: backendData.userFullName || '',
      balance: backendData.currentBalanceRials || 0,
      currency: 'ریال',
      lastUpdated: backendData.createdAt || new Date().toISOString(),
      createdAt: backendData.createdAt || new Date().toISOString(),
    } : null;

    // Strongly typed response structure
    const response: GetWalletResponse = {
      result: frontendWallet,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Get wallet balance BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}
