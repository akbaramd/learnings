import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetQuestionAnswerDetailsResponse } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/responses/[responseId]/questions/[questionId]/answer
 * Get question answer details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ responseId: string; questionId: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { responseId, questionId } = await params;

    if (!responseId || !questionId) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Response ID and Question ID are required',
        errors: ['Response ID and Question ID are required'],
        data: null,
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const includeQuestionDetailsParam = searchParams.get('includeQuestionDetails');
    const includeSurveyDetailsParam = searchParams.get('includeSurveyDetails');
    const includeQuestionDetails = includeQuestionDetailsParam === 'false' ? false : true;
    const includeSurveyDetails = includeSurveyDetailsParam === 'true' ? true : false;

    const upstream = await api.api.getQuestionAnswerDetails(responseId, questionId, {
      includeQuestionDetails,
      includeSurveyDetails,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetQuestionAnswerDetailsResponse = {
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

