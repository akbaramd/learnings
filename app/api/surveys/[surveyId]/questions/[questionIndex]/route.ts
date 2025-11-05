import { NextRequest, NextResponse } from 'next/server';
import { createApiInstance, handleApiError } from '@/app/api/generatedClient';
import { GetSpecificQuestionResponseWrapper } from '@/src/store/surveys/surveys.types';
import { AxiosError } from 'axios';

/**
 * GET /api/surveys/[surveyId]/questions/[questionIndex]
 * Get specific question by index
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string; questionIndex: string }> }
) {
  try {
    const api = createApiInstance(req);
    const { surveyId, questionIndex } = await params;

    if (!surveyId || !questionIndex) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Survey ID and Question Index are required',
        errors: ['Survey ID and Question Index are required'],
        data: null,
      }, { status: 400 });
    }

    const questionIndexNum = Number(questionIndex);
    if (!Number.isFinite(questionIndexNum)) {
      return NextResponse.json({
        isSuccess: false,
        message: 'Question Index must be a number',
        errors: ['Question Index must be a number'],
        data: null,
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const userNationalNumber = searchParams.get('userNationalNumber') || undefined;
    const responseId = searchParams.get('responseId') || undefined;
    const includeUserAnswersParam = searchParams.get('includeUserAnswers');
    const includeNavigationInfoParam = searchParams.get('includeNavigationInfo');
    const includeStatisticsParam = searchParams.get('includeStatistics');
    const includeUserAnswers = includeUserAnswersParam === 'false' ? false : true;
    const includeNavigationInfo = includeNavigationInfoParam === 'false' ? false : true;
    const includeStatistics = includeStatisticsParam === 'true' ? true : false;

    const upstream = await api.api.getSpecificQuestion(surveyId, questionIndexNum, {
      userNationalNumber,
      responseId,
      includeUserAnswers,
      includeNavigationInfo,
      includeStatistics,
    }, {});
    
    const status = upstream.status ?? 200;

    const response: GetSpecificQuestionResponseWrapper = {
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

