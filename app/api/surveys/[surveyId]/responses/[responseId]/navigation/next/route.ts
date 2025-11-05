import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GoNextQuestionResponseWrapper } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * POST /api/surveys/[surveyId]/responses/[responseId]/navigation/next
 * Go to next question
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string; responseId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { surveyId, responseId } = await params;

    if (!surveyId || !responseId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Survey ID and Response ID are required',
        errors: ['Survey ID and Response ID are required'],
        data: null,
      }, { status: 400 });
    }

    const upstream = await api.api.goNextQuestion(surveyId, responseId, {});
    
    const status = upstream.status ?? 200;

    const response: GoNextQuestionResponseWrapper = {
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

