// app/api/wallets/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetTransactionsResponseWrapper, GetTransactionsRequest, TransactionType } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const queryParams: GetTransactionsRequest = {};
    
    if (searchParams.get('pageNumber')) {
      queryParams.pageNumber = parseInt(searchParams.get('pageNumber')!);
    }
    if (searchParams.get('pageSize')) {
      queryParams.pageSize = parseInt(searchParams.get('pageSize')!);
    }
    if (searchParams.get('transactionType')) {
      queryParams.type = searchParams.get('transactionType') as TransactionType || undefined;
    }
    if (searchParams.get('fromDate')) {
      queryParams.fromDate = searchParams.get('fromDate') || undefined;
    }
    if (searchParams.get('toDate')) {
      queryParams.toDate = searchParams.get('toDate') || undefined;
    }

    // Call the upstream API to get wallet transactions
    const upstream = await api.api.getWalletTransactions({
      pageNumber: queryParams.pageNumber,
      pageSize: queryParams.pageSize,
      transactionType: queryParams.type,
      fromDate: queryParams.fromDate,
      toDate: queryParams.toDate,
    });
    const status = upstream.status ?? 200;

    // Map backend response to frontend GetTransactionsResponse type
    const backendData = upstream.data?.data;
    const frontendTransactions = backendData ? {
      walletId: backendData.walletId || '',
      userId: backendData.userExternalUserId || '',
      transactions: backendData.transactions?.map((tx) => ({
        id: tx.transactionId || '',
        type: (tx.transactionType as TransactionType) || 'deposit',
        amount: tx.amountRials || 0,
        balanceAfter: tx.balanceBeforeRials || 0,
        description: tx.description || '',
        reference: tx.externalReference || '',
        createdAt: tx.createdAt || new Date().toISOString(),
        processedAt: tx.createdAt || new Date().toISOString(),
        metadata: tx.metadata || {},
      })) || [],
      statistics: backendData.statistics ? {
        totalTransactions: backendData.statistics.totalTransactions || 0,
        totalDeposits: backendData.statistics.totalDepositRials || 0,
        totalWithdrawals: backendData.statistics.totalWithdrawalRials || 0,
        totalPayments: backendData.statistics.totalPaymentRials || 0,
        totalDepositAmount: backendData.statistics.totalDepositRials || 0,
        totalWithdrawalAmount: backendData.statistics.totalWithdrawalRials || 0,
        totalPaymentAmount: backendData.statistics.totalPaymentRials || 0,
      } : {
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalDepositAmount: 0,
        totalWithdrawalAmount: 0,
        totalPaymentAmount: 0,
      },
      pageNumber: backendData.pageNumber || queryParams.pageNumber || 1,
      pageSize: backendData.pageSize || queryParams.pageSize || 10,
      totalPages: Math.ceil((backendData.totalCount || 0) / (backendData.pageSize || 10)),
    } : null;

    // Strongly typed response structure
    const response: GetTransactionsResponseWrapper = {
      result: frontendTransactions,
      errors: upstream.data?.errors || null
    };

    return NextResponse.json(response, { status });
  } catch (error) {
    console.error('Get wallet transactions BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError, req);
  }
}
