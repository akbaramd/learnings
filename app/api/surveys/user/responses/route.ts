import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetSurveysWithUserResponsesResponse } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/user/responses
 * Get surveys with user responses
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
    const userResponseStatus = searchParams.get('userResponseStatus') || undefined;
    const hasUserResponseParam = searchParams.get('hasUserResponse');
    const canUserParticipateParam = searchParams.get('canUserParticipate');
    const minUserCompletionPercentageRaw = searchParams.get('minUserCompletionPercentage');
    const maxUserCompletionPercentageRaw = searchParams.get('maxUserCompletionPercentage');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortDirection = searchParams.get('sortDirection') || undefined;
    const includeQuestionsParam = searchParams.get('includeQuestions');
    const includeUserResponsesParam = searchParams.get('includeUserResponses');
    const includeUserLastResponseParam = searchParams.get('includeUserLastResponse');

    const pageNumber = Number.isFinite(Number(pageNumberRaw)) && Number(pageNumberRaw) > 0
      ? Number(pageNumberRaw)
      : 1;

    const pageSize = Number.isFinite(Number(pageSizeRaw)) && Number(pageSizeRaw) > 0
      ? Number(pageSizeRaw)
      : 20;

    const isAcceptingResponses = isAcceptingResponsesParam === 'true' ? true :
      isAcceptingResponsesParam === 'false' ? false : undefined;
    const hasUserResponse = hasUserResponseParam === 'true' ? true :
      hasUserResponseParam === 'false' ? false : undefined;
    const canUserParticipate = canUserParticipateParam === 'true' ? true :
      canUserParticipateParam === 'false' ? false : undefined;
    const minUserCompletionPercentage = minUserCompletionPercentageRaw && Number.isFinite(Number(minUserCompletionPercentageRaw))
      ? Number(minUserCompletionPercentageRaw)
      : undefined;
    const maxUserCompletionPercentage = maxUserCompletionPercentageRaw && Number.isFinite(Number(maxUserCompletionPercentageRaw))
      ? Number(maxUserCompletionPercentageRaw)
      : undefined;
    const includeQuestions = includeQuestionsParam === 'true' ? true : false;
    const includeUserResponses = includeUserResponsesParam === 'false' ? false : true;
    const includeUserLastResponse = includeUserLastResponseParam === 'false' ? false : true;

    const upstream = await api.api.getSurveysWithUserResponses({
      pageNumber,
      pageSize,
      searchTerm,
      state,
      isAcceptingResponses,
      userResponseStatus,
      hasUserResponse,
      canUserParticipate,
      minUserCompletionPercentage,
      maxUserCompletionPercentage,
      sortBy,
      sortDirection,
      includeQuestions,
      includeUserResponses,
      includeUserLastResponse,
    }, {});
    
    const status = upstream.status ?? 200;

    // Use upstream isSuccess if available, otherwise check if data exists and status is successful
    const isSuccess = upstream.data?.isSuccess !== undefined 
      ? upstream.data.isSuccess 
      : (status === 200 && !!upstream.data?.data);
    console.log('upstream.data', upstream.data);
    const response: GetSurveysWithUserResponsesResponse = {
      isSuccess,
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

