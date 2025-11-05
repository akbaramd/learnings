import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetCurrentQuestionResponse } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/[surveyId]/responses/[responseId]/questions/current
 * Get current question
 */
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const repeatIndexRaw = searchParams.get('repeatIndex');
    const repeatIndex = repeatIndexRaw && Number.isFinite(Number(repeatIndexRaw))
      ? Number(repeatIndexRaw)
      : undefined;

    const upstream = await api.api.getCurrentQuestion(surveyId, responseId, {
      repeatIndex,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetCurrentQuestionResponse = {
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

