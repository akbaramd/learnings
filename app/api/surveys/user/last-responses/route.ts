import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetSurveysWithUserLastResponseResponse } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/user/last-responses
 * Get surveys with user last response
 */
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);
    const { searchParams } = new URL(req.url);

    const pageNumberRaw = searchParams.get('pageNumber');
    const pageSizeRaw = searchParams.get('pageSize');
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const state = searchParams.get('state') || undefined;
    const isAcceptingResponsesParam = searchParams.get('isAcceptingResponses');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortDirection = searchParams.get('sortDirection') || undefined;
    const includeQuestionsParam = searchParams.get('includeQuestions');
    const includeUserLastResponseParam = searchParams.get('includeUserLastResponse');

    const pageNumber = Number.isFinite(Number(pageNumberRaw)) && Number(pageNumberRaw) > 0
      ? Number(pageNumberRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 20;

    const isAcceptingResponses = isAcceptingResponsesParam === 'true' ? true :
      isAcceptingResponsesParam === 'false' ? false : undefined;
    const includeQuestions = includeQuestionsParam === 'true' ? true : false;
    const includeUserLastResponse = includeUserLastResponseParam === 'false' ? false : true;

    const upstream = await api.api.getSurveysWithUserLastResponse({
      pageNumber,
      pageSize,
      searchTerm,
      state,
      isAcceptingResponses,
      sortBy,
      sortDirection,
      includeQuestions,
      includeUserLastResponse,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetSurveysWithUserLastResponseResponse = {
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

