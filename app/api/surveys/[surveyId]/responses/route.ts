import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { StartSurveyResponseResponse } from '@/src/store/surveys/surveys.types';
import { StartSurveyResponseRequest } from '@/src/services/Api';
import { AxiosError } from 'axios';

/**
 * POST /api/surveys/[surveyId]/responses
 * Start a new survey response
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { surveyId } = await params;

    if (!surveyId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Survey ID is required',
        errors: ['Survey ID is required'],
        data: null,
      }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as StartSurveyResponseRequest;

    const upstream = await api.api.startSurveyResponse(surveyId, body, {});
    
    const status = upstream.status ?? 200;

    const response: StartSurveyResponseResponse = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Operation completed',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined,
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

