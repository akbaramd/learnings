'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetResponseDetailsQuery,
  useSubmitResponseMutation,
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
  PiWarning,
  PiClipboardText,
  PiCheck,
} from 'react-icons/pi';

interface ResponseDonePageProps {
  params: Promise<{ surveyId: string; responseId: string }>;
}

export default function ResponseDonePage({ params }: ResponseDonePageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');
  const [responseIdFromParams, setResponseIdFromParams] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redux selectors
  const isLoading = useSelector(selectSurveysLoading);
  const responseDetails = useSelector(selectSelectedResponse);

  // Query hooks
  const [getResponseDetails, { isLoading: isDetailsLoading }] = useLazyGetResponseDetailsQuery();
  const [submitResponse, { isLoading: isSubmitting }] = useSubmitResponseMutation();

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

  // Handle submit response
  const handleSubmit = useCallback(async () => {
    if (!agreed) {
      setValidationError('لطفاً قبل از ارسال، قوانین و مقررات را مطالعه و تأیید کنید.');
      return;
    }

    if (!surveyIdFromParams || !responseIdFromParams) {
      return;
    }

    try {
      const result = await submitResponse({
        surveyId: surveyIdFromParams,
        responseId: responseIdFromParams,
      });

      if (result.data?.isSuccess) {
        // Redirect to response details page
        router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}`);
      } else {
        setValidationError(result.data?.message || 'خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.');
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      setValidationError('خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.');
    }
  }, [agreed, surveyIdFromParams, responseIdFromParams, submitResponse, router]);

  const handleBack = () => {
    router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}`);
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
  const isSubmitted = responseDetails.status?.isSubmitted === true;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="بررسی نهایی"
        titleIcon={<PiClipboardText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          {/* Info Card */}
          <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <PiCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  بررسی و تأیید نهایی
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  لطفاً پاسخ‌های خود را بررسی کنید. پس از تأیید، پاسخ شما ارسال خواهد شد و امکان ویرایش وجود ندارد.
                </p>
              </div>
            </div>
          </Card>

          {/* Survey Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              اطلاعات نظرسنجی
            </h3>
            <div className="space-y-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">عنوان:</span> {surveyTitle}
              </div>
              {responseDetails.attemptNumber && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">تلاش شماره:</span> {responseDetails.attemptNumber}
                </div>
              )}
            </div>
          </Card>

          {/* Questions and Answers Review */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              پاسخ‌های شما ({questionAnswers.length} سوال)
            </h3>
            <div className="space-y-4">
              {questionAnswers.map((qa: QuestionAnswerDetailsDto, index: number) => {
                const question = qa.question;
                if (!question) return null;

                const questionText = question.text || `سوال ${index + 1}`;
                const questionNumber = question.order || index + 1;
                const isRequired = question.isRequired === true;
                const textAnswer = qa.textAnswer;
                const selectedOptions = qa.selectedOptions || [];

                return (
                  <div
                    key={question.id || index}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {questionNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {questionText}
                        </h4>
                        {isRequired && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <PiWarning className="h-3 w-3" />
                            الزامی
                          </span>
                        )}
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
              })}
            </div>
          </Card>

          {/* Agreement Checkbox */}
          <Card variant="default" radius="lg" padding="md">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setValidationError(null);
                }}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  قوانین و مقررات را مطالعه کرده و با آن‌ها موافقم
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  با تأیید این گزینه، پاسخ شما ارسال خواهد شد و امکان ویرایش وجود ندارد.
                </p>
              </div>
            </label>
          </Card>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <PiWarning className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              block
              onClick={handleBack}
              disabled={isSubmitting}
            >
              بازگشت
            </Button>
            <Button
              variant="primary"
              size="md"
              block
              onClick={handleSubmit}
              disabled={isSubmitting || !agreed || isSubmitted}
              rightIcon={<PiCheckCircle className="h-4 w-4" />}
            >
              {isSubmitting ? 'در حال ارسال...' : isSubmitted ? 'ارسال شده' : 'تأیید و ارسال'}
            </Button>
          </div>
        </div>
      </ScrollableArea>
    </div>
  );
}

