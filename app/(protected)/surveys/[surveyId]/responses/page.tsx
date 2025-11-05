'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetSurveyDetailsWithUserQuery,
  useLazyGetUserSurveyResponsesQuery,
  selectSelectedSurvey,
  selectSurveysLoading,
  type ResponseDto,
} from '@/src/store/surveys';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import {
  PiArrowRight,
  PiClock,
  PiCheckCircle,
  PiFileText,
  PiList,
} from 'react-icons/pi';

interface SurveyResponsesPageProps {
  params: Promise<{ surveyId: string }>;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString('fa-IR');
  } catch {
    return 'نامشخص';
  }
}

export default function SurveyResponsesPage({ params }: SurveyResponsesPageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');

  // Redux selectors
  const isLoading = useSelector(selectSurveysLoading);
  const survey = useSelector(selectSelectedSurvey);

  // Query hooks
  const [getSurveyDetails, { isLoading: isDetailsLoading }] = useLazyGetSurveyDetailsWithUserQuery();
  const [getUserResponses, { data: responsesData, isLoading: isResponsesLoading }] = useLazyGetUserSurveyResponsesQuery();

  // Get survey ID from params
  useEffect(() => {
    params.then(({ surveyId }) => {
      setSurveyIdFromParams(surveyId);
    });
  }, [params]);

  // Fetch survey details and responses
  useEffect(() => {
    if (surveyIdFromParams) {
      getSurveyDetails(surveyIdFromParams);
      getUserResponses({
        surveyId: surveyIdFromParams,
        includeAnswers: true,
        includeLastAnswersOnly: false,
      });
    }
  }, [surveyIdFromParams, getSurveyDetails, getUserResponses]);

  const handleBack = () => {
    if (surveyIdFromParams) {
      router.push(`/surveys/${surveyIdFromParams}`);
    } else {
      router.push('/surveys');
    }
  };

  const handleResponseClick = (response: ResponseDto) => {
    if (surveyIdFromParams && response.id) {
      router.push(`/surveys/${surveyIdFromParams}/responses/${response.id}`);
    }
  };

  // Access responses from response
  const responses: ResponseDto[] = responsesData?.data?.responses || [];

  if ((isLoading || isDetailsLoading) && !survey) {
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

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={survey?.title ? `پاسخ‌های ${survey.title}` : 'پاسخ‌های نظرسنجی'}
        titleIcon={<PiList className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          {isResponsesLoading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری پاسخ‌ها...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PiFileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">پاسخی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((response, index) => {
                const isSubmitted = response.isSubmitted === true;
                const isActive = response.isActive === true;
                const isExpired = response.isExpired === true;
                const isCanceled = response.isCanceled === true;
                const completionPercentage = response.completionPercentage || 0;
                
                // Subtle alternating backgrounds
                const bgClass = index % 2 === 0 
                  ? 'bg-white dark:bg-gray-900' 
                  : 'bg-gray-50/50 dark:bg-gray-900/50';
                
                // Accent colors based on state
                const accentClass = isSubmitted
                  ? 'ring-1 ring-green-100 dark:ring-green-900/30 border-l-2 border-l-green-400 dark:border-l-green-600'
                  : isActive
                  ? 'ring-1 ring-blue-100 dark:ring-blue-900/30 border-l-2 border-l-blue-400 dark:border-l-blue-600'
                  : isExpired
                  ? 'ring-1 ring-gray-200 dark:ring-gray-800 border-l-2 border-l-gray-400 dark:border-l-gray-600'
                  : 'ring-1 ring-gray-200 dark:ring-gray-800 border-l-2 border-l-gray-400 dark:border-l-gray-600';
                
                return (
                  <Card
                    key={response.id}
                    variant="default"
                    radius="lg"
                    padding="lg"
                    hover={true}
                    clickable={true}
                    onClick={() => handleResponseClick(response)}
                    className={`
                      transition-all duration-200
                      ${bgClass}
                      ${accentClass}
                      shadow-sm hover:shadow-md
                    `}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            تلاش شماره {response.attemptNumber || 1}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isSubmitted && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                <PiCheckCircle className="h-3.5 w-3.5" />
                                ارسال شده
                              </span>
                            )}
                            {isActive && !isSubmitted && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                در حال تکمیل
                              </span>
                            )}
                            {isExpired && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                منقضی شده
                              </span>
                            )}
                            {isCanceled && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                لغو شده
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dates */}
                        {(response.submittedAt || response.expiredAt || response.canceledAt) && (
                          <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mb-3">
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              {response.submittedAt && (
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <PiClock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                  <span className="font-medium">ارسال:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{formatDate(response.submittedAt)}</span>
                                </div>
                              )}
                              {response.expiredAt && (
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <PiClock className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="font-medium">منقضی:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{formatDate(response.expiredAt)}</span>
                                </div>
                              )}
                              {response.canceledAt && (
                                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                  <PiClock className="h-3.5 w-3.5 text-red-400" />
                                  <span className="font-medium">لغو:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{formatDate(response.canceledAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Progress */}
                        {completionPercentage > 0 && (
                          <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">پیشرفت:</span>
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
                            {response.totalQuestions !== undefined && response.answeredQuestions !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                {response.answeredQuestions} از {response.totalQuestions} سوال پاسخ داده شده
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Details */}
                        {response.responseStatusText && (
                          <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              وضعیت: <span className="font-medium text-gray-900 dark:text-gray-100">{response.responseStatusText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <PiArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

