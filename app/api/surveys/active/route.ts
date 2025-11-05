import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetActiveSurveysResponse } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/active
 * Get active surveys
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageNumberRaw = searchParams.get('pageNumber');
    const pageSizeRaw = searchParams.get('pageSize');
    const featureKey = searchParams.get('featureKey') || undefined;
    const capabilityKey = searchParams.get('capabilityKey') || undefined;

    const pageNumber = Number.isFinite(Number(pageNumberRaw)) && Number(pageNumberRaw) > 0
      ? Number(pageNumberRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 20;

    const upstream = await api.api.getActiveSurveys({
      pageNumber,
      pageSize,
      featureKey,
      capabilityKey,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetActiveSurveysResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined
    };

    const res = NextResponse.json(response, { status });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) setCookie.forEach(c => res.headers.append('set-cookie', c));
      else res.headers.set('set-cookie', setCookie as string);
    }

    return res;
  } catch (error) {
    console.error('[Surveys] BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });

    return handleApiError(error as AxiosError);
  }
}

