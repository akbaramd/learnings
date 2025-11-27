// app/api/wallets/deposits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetDepositsResponseWrapper, GetDepositsRequest, DepositStatus } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const queryParams: GetDepositsRequest = {};
    
    if (searchParams.get('pageNumber')) {
      queryParams.pageNumber = parseInt(searchParams.get('pageNumber')!);
    }
    if (searchParams.get('pageSize')) {
      queryParams.pageSize = parseInt(searchParams.get('pageSize')!);
    }
    if (searchParams.get('status')) {
      queryParams.status = searchParams.get('status') as DepositStatus || undefined;
    }
    if (searchParams.get('fromDate')) {
      queryParams.fromDate = searchParams.get('fromDate') || undefined;
    }
    if (searchParams.get('toDate')) {
      queryParams.toDate = searchParams.get('toDate') || undefined;
    }
 
    // Call the upstream API to get wallet deposits
    const upstream = await api.api.listUserWalletDeposits({ 
      page: queryParams.pageNumber,
      
      pageSize: queryParams.pageSize,
      status: queryParams.status || undefined,
      fromDate: queryParams.fromDate || undefined,
      toDate: queryParams.toDate || undefined,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend GetDepositsResponse type
    const backendData = upstream.data?.data;
    const frontendDeposits = backendData ? {
      userId: backendData.externalUserId || '',
      deposits: backendData.deposits?.map((deposit) => ({
        id: deposit.depositId || '',
        walletId: deposit.walletId || '',
        trackingCode: deposit.trackingCode || '',
        amount: deposit.amountRials || 0,
        status: (deposit.status as DepositStatus) || 'pending',
        statusText: deposit.statusText || undefined,
        description: deposit.description || '',
        createdAt: deposit.requestedAt || new Date().toISOString(),
        processedAt: deposit.requestedAt || new Date().toISOString(),
        metadata: deposit.metadata || {},
      })) || [],
      pageNumber: backendData.page || queryParams.pageNumber || 1,
      pageSize: backendData.pageSize || queryParams.pageSize || 10,
      totalPages: backendData.totalPages || 1,
    } : null;

    // Strongly typed response structure
    const response: GetDepositsResponseWrapper = {
      result: frontendDeposits,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Get wallet deposits BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}
