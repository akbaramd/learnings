import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { AnswerQuestionResponseWrapper } from '@/src/store/surveys/surveys.types';
import { AnswerQuestionRequest } from '@/src/services/Api';
import { AxiosError } from 'axios';

/**
 * PUT /api/surveys/[surveyId]/responses/[responseId]/answers/[questionId]
 * Answer a question
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string; responseId: string; questionId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { surveyId, responseId, questionId } = await params;

    if (!surveyId || !responseId || !questionId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Survey ID, Response ID, and Question ID are required',
        errors: ['Survey ID, Response ID, and Question ID are required'],
        data: null,
      }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as AnswerQuestionRequest;

    const upstream = await api.api.answerQuestion(surveyId, responseId, questionId, body, {});
    
    const status = upstream.status ?? 200;

    const response: AnswerQuestionResponseWrapper = {
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

