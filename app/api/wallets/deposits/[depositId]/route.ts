import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetDepositDetailsResponseWrapper, DepositStatus } from '@/src/store/wallets/wallets.types';
import { AxiosError } from 'axios';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { depositId } = await params;

    if (!depositId) {
      return NextResponse.json(
        { result: null, errors: ['depositId is required'] },
        { status: 400 }
      );
    }

    const upstream = await api.api.getWalletDepositDetails(depositId);
    const status = upstream.status ?? 200;

    const data = upstream.data?.data;
    const result = data
      ? {
          id: data.depositId || '',
          walletId: data.walletId || '',
          externalUserId: data.externalUserId || undefined,
          trackingCode: data.trackingCode || undefined,
          amount: data.amountRials || 0,
          currency: data.currency || undefined,
          status: (data.status as DepositStatus) || 'Pending',
          requestedAt: data.requestedAt || new Date().toISOString(),
          completedAt: data.completedAt || undefined,
        }
      : null;

    const response: GetDepositDetailsResponseWrapper = {
      result,
      errors: upstream.data?.errors || null,
    };

    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach((c) => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Wallets] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}


