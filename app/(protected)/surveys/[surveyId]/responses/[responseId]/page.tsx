'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetResponseDetailsQuery,
  useLazyGetCurrentQuestionQuery,
  selectSelectedResponse,
  selectSurveysLoading,
} from '@/src/store/surveys';
import type {
  QuestionAnswerDetailsDto,
  QuestionOptionDto,
} from '@/src/services/Api';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  PiCheckCircle,
  PiClock,
  PiFileText,
  PiClipboardText,
  PiCheck,
  PiArrowRight,
  PiPlay,
} from 'react-icons/pi';

interface ResponseDetailsPageProps {
  params: Promise<{ surveyId: string; responseId: string }>;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'نامشخص';
  }
}

export default function ResponseDetailsPage({ params }: ResponseDetailsPageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');
  const [responseIdFromParams, setResponseIdFromParams] = useState<string>('');

  // Redux selectors
  const isLoading = useSelector(selectSurveysLoading);
  const responseDetails = useSelector(selectSelectedResponse);

  // Query hooks
  const [getResponseDetails, { isLoading: isDetailsLoading }] = useLazyGetResponseDetailsQuery();
  const [getCurrentQuestion, { isLoading: isGettingCurrentQuestion }] = useLazyGetCurrentQuestionQuery();

  // Get params from URL
  useEffect(() => {
    params.then(({ surveyId, responseId }) => {
      setSurveyIdFromParams(surveyId);
      setResponseIdFromParams(responseId);
    });
  }, [params]);

  // Fetch response details with questions and answers
  useEffect(() => {
    if (responseIdFromParams) {
      getResponseDetails({
        responseId: responseIdFromParams,
        includeQuestionDetails: true,
        includeSurveyDetails: true,
      });
    }
  }, [responseIdFromParams, getResponseDetails]);

  const handleBack = () => {
    if (surveyIdFromParams) {
      router.push(`/surveys/${surveyIdFromParams}/responses`);
    } else {
      router.push('/surveys');
    }
  };

  const handleContinueResponse = async () => {
    if (!surveyIdFromParams || !responseIdFromParams) {
      return;
    }

    try {
      // Get current question
      const result = await getCurrentQuestion({
        surveyId: surveyIdFromParams,
        responseId: responseIdFromParams,
      });

      if (result.data?.isSuccess && result.data?.data?.questionId) {
        // Navigate to answer page for current question
        router.push(
          `/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/questions/${result.data.data.questionId}/answer`
        );
      } else {
        // If no current question, try to find first unanswered question from response details
        const questionAnswers = responseDetails?.questionAnswers || [];
        const firstUnanswered = questionAnswers.find(
          (qa) => !qa.isAnswered || !qa.isComplete
        );
        
        if (firstUnanswered?.questionId) {
          router.push(
            `/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/questions/${firstUnanswered.questionId}/answer`
          );
        } else {
          // No unanswered questions, go to done page
          router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/done`);
        }
      }
    } catch (error) {
      console.error('Failed to get current question:', error);
      // Fallback: try to find first unanswered question
      const questionAnswers = responseDetails?.questionAnswers || [];
      const firstUnanswered = questionAnswers.find(
        (qa) => !qa.isAnswered || !qa.isComplete
      );
      
      if (firstUnanswered?.questionId) {
        router.push(
          `/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}/questions/${firstUnanswered.questionId}/answer`
        );
      }
    }
  };

  if ((isLoading || isDetailsLoading) && !responseDetails) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="در حال بارگذاری..."
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (!responseDetails) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="پاسخ یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">پاسخ مورد نظر یافت نشد</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  const surveyTitle = responseDetails.survey?.title || 'نظرسنجی';
  const questionAnswers = responseDetails.questionAnswers || [];
  const status = responseDetails.status;
  const statistics = responseDetails.statistics;
  const isSubmitted = status?.isSubmitted === true;
  const canContinue = status?.canContinue === true;
  const completionPercentage = statistics?.completionPercentage || 0;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={`پاسخ ${responseDetails.attemptNumber || ''}`}
        titleIcon={<PiFileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          {/* Status Card */}
          {isSubmitted ? (
            <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    پاسخ ارسال شده
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    این پاسخ با موفقیت ارسال شده است و امکان ویرایش وجود ندارد.
                  </p>
                </div>
              </div>
            </Card>
          ) : canContinue ? (
            <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <PiPlay className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    پاسخ در حال تکمیل
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    می‌توانید پاسخ‌های خود را ادامه دهید و پس از تکمیل، پاسخ را ارسال کنید.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleContinueResponse}
                    disabled={isGettingCurrentQuestion}
                    rightIcon={<PiArrowRight className="h-4 w-4" />}
                  >
                    {isGettingCurrentQuestion ? 'در حال بارگذاری...' : 'ادامه پاسخ'}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Survey Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              اطلاعات نظرسنجی
            </h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">عنوان:</span> {surveyTitle}
              </div>
              {responseDetails.attemptNumber && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">تلاش شماره:</span> {responseDetails.attemptNumber}
                </div>
              )}
              {status?.statusMessage && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">وضعیت:</span> {status.statusMessage}
                </div>
              )}
            </div>
          </Card>

          {/* Statistics */}
          {statistics && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                آمار پاسخ
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">درصد تکمیل:</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {statistics.totalQuestions !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">کل سوالات</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {statistics.totalQuestions}
                      </div>
                    </div>
                  )}
                  {statistics.answeredQuestions !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">پاسخ داده شده</div>
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {statistics.answeredQuestions}
                      </div>
                    </div>
                  )}
                  {statistics.requiredQuestions !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">سوالات الزامی</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {statistics.requiredQuestions}
                      </div>
                    </div>
                  )}
                  {statistics.requiredAnsweredQuestions !== undefined && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">پاسخ داده شده (الزامی)</div>
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {statistics.requiredAnsweredQuestions}
                      </div>
                    </div>
                  )}
                </div>
                {statistics.firstAnswerAt && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <PiClock className="h-3.5 w-3.5" />
                      <span>اولین پاسخ: {formatDate(statistics.firstAnswerAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Questions and Answers */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              پاسخ‌های شما ({questionAnswers.length} سوال)
            </h3>
            <div className="space-y-4">
              {questionAnswers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PiClipboardText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">پاسخی ثبت نشده است</p>
                </div>
              ) : (
                questionAnswers.map((qa: QuestionAnswerDetailsDto, index: number) => {
                  const question = qa.question;
                  if (!question) return null;

                  const questionText = question.text || `سوال ${index + 1}`;
                  const questionNumber = question.order || index + 1;
                  const isRequired = question.isRequired === true;
                  const isAnswered = qa.isAnswered === true;
                  const isComplete = qa.isComplete === true;
                  const textAnswer = qa.textAnswer;
                  const selectedOptions = qa.selectedOptions || [];

                  return (
                    <div
                      key={question.id || index}
                      className={`p-4 rounded-lg border ${
                        isAnswered && isComplete
                          ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                          : isAnswered
                          ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isAnswered && isComplete
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : isAnswered
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <span className={`text-xs font-bold ${
                            isAnswered && isComplete
                              ? 'text-green-600 dark:text-green-400'
                              : isAnswered
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {questionNumber}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {questionText}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isRequired && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                الزامی
                              </span>
                            )}
                            {isAnswered && isComplete && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <PiCheckCircle className="h-3 w-3" />
                                تکمیل شده
                              </span>
                            )}
                            {isAnswered && !isComplete && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                پاسخ داده شده
                              </span>
                            )}
                            {!isAnswered && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                بدون پاسخ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Answer Display */}
                      <div className="mr-9">
                        {textAnswer ? (
                          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {textAnswer}
                            </p>
                          </div>
                        ) : selectedOptions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedOptions.map((option: QuestionOptionDto) => {
                              if (!option.id || !option.isActive) return null;
                              return (
                                <div
                                  key={option.id}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800"
                                >
                                  <PiCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {option.text || 'گزینه بدون عنوان'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              بدون پاسخ
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Validation Errors */}
          {status?.validationErrors && status.validationErrors.length > 0 && (
            <Card variant="default" radius="lg" padding="md" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                خطاهای اعتبارسنجی
              </h3>
              <ul className="space-y-1">
                {status.validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 dark:text-red-400">
                    • {error}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

