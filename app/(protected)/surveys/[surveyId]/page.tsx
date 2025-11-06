'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetParticipationStatusQuery,
  useLazyGetUserSurveyResponsesQuery,
  useStartSurveyResponseMutation,
  selectSurveysLoading,
  selectParticipationStatus,
  selectUserSurveyResponses,
  type ResponseDto,
} from '@/src/store/surveys';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import Drawer, { DrawerHeader, DrawerBody, DrawerFooter } from '@/src/components/overlays/Drawer';
import {
  PiClipboardText,
  PiArrowRight,
  PiCheckCircle,
  PiFileText,
  PiPlay,
  PiList,
  PiWarning,
} from 'react-icons/pi';

interface SurveyDetailPageProps {
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

export default function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');
  
  // Modal states
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showStartNewConfirm, setShowStartNewConfirm] = useState(false);

  // Redux selectors
  const isLoading = useSelector(selectSurveysLoading);
  const participationStatus = useSelector(selectParticipationStatus);
  const userSurveyResponses = useSelector(selectUserSurveyResponses);

  // Query hooks
  const [getParticipationStatus] = useLazyGetParticipationStatusQuery();
  const [getUserResponses, { isLoading: isResponsesLoading }] = useLazyGetUserSurveyResponsesQuery();
  const [startSurveyResponse, { isLoading: isStartingResponse }] = useStartSurveyResponseMutation();

  // Get survey ID from params
  useEffect(() => {
    params.then(({ surveyId }) => {
      setSurveyIdFromParams(surveyId);
    });
  }, [params]);

  // Fetch user responses and participation status (UserSurveyResponsesResponse contains survey info)
  useEffect(() => {
    if (surveyIdFromParams) {
      getParticipationStatus({ surveyId: surveyIdFromParams });
      getUserResponses({
        surveyId: surveyIdFromParams,
        includeAnswers: false,
        includeLastAnswersOnly: false,
      });
    }
  }, [surveyIdFromParams, getParticipationStatus, getUserResponses]);

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/surveys')) {
      router.back();
    } else {
      router.push('/surveys');
    }
  };

  const handleStartResponse = async () => {
    if (!surveyIdFromParams || isStartingResponse) return;
    
    try {
      const result = await startSurveyResponse({
        surveyId: surveyIdFromParams,
        data: {
          forceNewAttempt: false,
          resumeActiveIfAny: true,
        },
      });

      if (result.data?.isSuccess && result.data?.data?.responseId) {
        // Redirect to question answer page
        if (result.data.data.currentQuestionId) {
          router.push(`/surveys/${surveyIdFromParams}/responses/${result.data.data.responseId}/questions/${result.data.data.currentQuestionId}/answer`);
        } else {
          // Fallback: redirect to response details page
          router.push(`/surveys/${surveyIdFromParams}/responses/${result.data.data.responseId}`);
        }
      } else {
        console.error('Failed to start survey response:', result.data?.message || 'Unknown error');
        // Optionally show error message to user
      }
    } catch (error) {
      console.error('Failed to start survey response:', error);
      // Optionally show error message to user
    }
  };

  const handleConfirmStart = async () => {
    setShowStartConfirm(false);
    await handleStartResponse();
  };

  const handleConfirmStartNew = async () => {
    setShowStartNewConfirm(false);
    await handleStartResponse();
  };

  const handleViewResponses = () => {
    if (surveyIdFromParams) {
      router.push(`/surveys/${surveyIdFromParams}/responses`);
    }
  };

  const handleResponseClick = (response: ResponseDto) => {
    if (surveyIdFromParams && response.id) {
      router.push(`/surveys/${surveyIdFromParams}/responses/${response.id}`);
    }
  };

  // Access data from store (UserSurveyResponsesResponse)
  const responses: ResponseDto[] = userSurveyResponses?.responses || [];
  const latestResponse = userSurveyResponses?.latestResponse;
  const surveyTitle = userSurveyResponses?.surveyTitle;
  const surveyDescription = userSurveyResponses?.surveyDescription;
  const hasActiveResponse = userSurveyResponses?.hasActiveResponse === true;
  const canStartNewAttempt = userSurveyResponses?.canStartNewAttempt === true;
  const totalAttempts = userSurveyResponses?.totalAttempts || 0;
  const completedAttempts = userSurveyResponses?.completedAttempts || 0;
  const activeAttempts = userSurveyResponses?.activeAttempts || 0;
  
  // Check if latest response is completed (submitted)
  const isLatestResponseCompleted = latestResponse?.isSubmitted === true;
  
  // Check if user can start new attempt based on UserSurveyResponsesResponse and participation status
  const canStart = canStartNewAttempt || (participationStatus?.canStartNewAttempt === true);
  const hasAttemptsAvailable = participationStatus?.totalAttempts !== undefined 
    && participationStatus?.maxAllowedAttempts !== undefined
    ? participationStatus.totalAttempts < participationStatus.maxAllowedAttempts
    : true; // If max not defined, assume unlimited attempts

  if ((isLoading || isResponsesLoading) && !userSurveyResponses) {
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

  if (!userSurveyResponses || !surveyIdFromParams) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="نظرسنجی یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">نظرسنجی مورد نظر یافت نشد</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={surveyTitle || 'جزئیات نظرسنجی'}
        titleIcon={<PiClipboardText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        showBackButton={true}
        onBack={handleBack}
        rightActions={responses.length > 0 ? [
          {
            icon: <PiList className="h-4 w-4" />,
            onClick: handleViewResponses,
            label: 'مشاهده پاسخ‌ها',
            'aria-label': 'مشاهده پاسخ‌ها',
          },
        ] : undefined}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          {/* Call to Action / Guide Section - Start Survey Buttons */}
          {canStart && hasAttemptsAvailable && (
            <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <PiPlay className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {hasActiveResponse && !isLatestResponseCompleted
                      ? 'ادامه یا شروع جدید نظرسنجی'
                      : responses.length > 0 && isLatestResponseCompleted
                      ? 'شروع نظرسنجی جدید'
                      : 'شروع نظرسنجی'
                    }
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {hasActiveResponse && !isLatestResponseCompleted
                      ? 'می‌توانید پاسخ‌های قبلی خود را ادامه دهید یا پاسخ جدیدی شروع کنید.'
                      : responses.length > 0 && isLatestResponseCompleted
                      ? 'پاسخ‌های قبلی شما قابل مشاهده است. می‌توانید یک پاسخ جدید شروع کنید.'
                      : 'برای شرکت در این نظرسنجی، روی دکمه شروع کلیک کنید.'
                    }
                    {participationStatus?.totalAttempts !== undefined && participationStatus?.maxAllowedAttempts !== undefined && (
                      <span className="block mt-1 text-xs">
                        تلاش‌های استفاده شده: {participationStatus.totalAttempts} / {participationStatus.maxAllowedAttempts}
                      </span>
                    )}
                    {totalAttempts > 0 && (
                      <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                        کل تلاش‌ها: {totalAttempts} | تکمیل شده: {completedAttempts} | فعال: {activeAttempts}
                      </span>
                    )}
                  </p>
                  <div className="space-y-2">
                    {/* Start/Continue Button */}
                    {hasActiveResponse && !isLatestResponseCompleted ? (
                      // Has active response - show continue button
                      <>
                        <Button
                          variant="primary"
                          size="md"
                          block
                          onClick={() => {
                            if (surveyIdFromParams && latestResponse?.id) {
                              router.push(`/surveys/${surveyIdFromParams}/responses/${latestResponse.id}`);
                            }
                          }}
                          rightIcon={<PiArrowRight className="h-4 w-4" />}
                        >
                          ادامه پاسخ فعال
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          block
                          onClick={() => setShowStartNewConfirm(true)}
                          disabled={isStartingResponse}
                          rightIcon={<PiPlay className="h-4 w-4" />}
                        >
                          {isStartingResponse ? 'در حال شروع...' : 'شروع پاسخ جدید'}
                        </Button>
                      </>
                    ) : (
                      // No active response or all completed - show start new button
                      <Button
                        variant="primary"
                        size="md"
                        block
                        onClick={() => setShowStartConfirm(true)}
                        disabled={isStartingResponse}
                        rightIcon={<PiPlay className="h-4 w-4" />}
                      >
                        {isStartingResponse 
                          ? 'در حال شروع...' 
                          : responses.length > 0 && isLatestResponseCompleted
                          ? 'شروع پاسخ جدید'
                          : 'شروع نظرسنجی'
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Basic Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              اطلاعات کلی
            </h3>
            <div className="space-y-2">
              {surveyDescription && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">توضیحات</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {surveyDescription}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {canStart && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    <PiCheckCircle className="h-3 w-3 inline ml-1" />
                    قابل شروع
                  </span>
                )}
                {hasActiveResponse && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    پاسخ فعال
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Attempts Statistics */}
          {(totalAttempts > 0 || completedAttempts > 0 || activeAttempts > 0) && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                آمار تلاش‌ها
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {totalAttempts > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">کل تلاش‌ها</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {totalAttempts}
                    </div>
                  </div>
                )}
                {completedAttempts > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">تکمیل شده</div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {completedAttempts}
                    </div>
                  </div>
                )}
                {activeAttempts > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">فعال</div>
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {activeAttempts}
                    </div>
                  </div>
                )}
                {userSurveyResponses?.canceledAttempts !== undefined && userSurveyResponses.canceledAttempts > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">لغو شده</div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {userSurveyResponses.canceledAttempts}
                    </div>
                  </div>
                )}
                {userSurveyResponses?.expiredAttempts !== undefined && userSurveyResponses.expiredAttempts > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">منقضی شده</div>
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {userSurveyResponses.expiredAttempts}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Participation Status */}
          {participationStatus && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                وضعیت مشارکت
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                  <span className={`text-sm font-semibold ${
                    participationStatus.canStartNewAttempt 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {participationStatus.canStartNewAttempt ? 'قابل شروع' : 'غیرقابل شروع'}
                  </span>
                </div>
                {participationStatus.totalAttempts !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">تعداد تلاش‌ها:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {participationStatus.totalAttempts} / {participationStatus.maxAllowedAttempts || 'نامحدود'}
                    </span>
                  </div>
                )}
                {participationStatus.currentResponseId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">پاسخ فعلی:</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (surveyIdFromParams && participationStatus.currentResponseId) {
                          router.push(`/surveys/${surveyIdFromParams}/responses/${participationStatus.currentResponseId}`);
                        }
                      }}
                      rightIcon={<PiArrowRight className="h-3 w-3" />}
                    >
                      مشاهده
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* User Responses */}
          {responses.length > 0 && (
            <Card variant="default" radius="lg" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PiFileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  پاسخ‌های شما
                </h3>
                {responses.length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleViewResponses}
                  >
                    مشاهده همه ({responses.length})
                  </Button>
                )}
              </div>
              
              {isResponsesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری پاسخ‌ها...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {responses.slice(0, 3).map((response) => {
                    const isSubmitted = response.isSubmitted === true;
                    const completionPercentage = response.completionPercentage || 0;
                    
                    return (
                      <Card
                        key={response.id}
                        variant="default"
                        radius="md"
                        padding="md"
                        hover={true}
                        clickable={true}
                        onClick={() => handleResponseClick(response)}
                        className="border-l-2 border-l-blue-400 dark:border-l-blue-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                تلاش شماره {response.attemptNumber || 1}
                              </span>
                              {isSubmitted && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  ارسال شده
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              {response.submittedAt && (
                                <span>ارسال: {formatDate(response.submittedAt)}</span>
                              )}
                              {completionPercentage > 0 && (
                                <span>پیشرفت: {Math.round(completionPercentage)}%</span>
                              )}
                            </div>
                          </div>
                          <PiArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Latest Response Progress */}
          {latestResponse && latestResponse.completionPercentage !== undefined && latestResponse.completionPercentage > 0 && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                پیشرفت آخرین پاسخ
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">درصد تکمیل:</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.round(latestResponse.completionPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${latestResponse.completionPercentage}%` }}
                  />
                </div>
                {latestResponse.answeredQuestions !== undefined && latestResponse.totalQuestions !== undefined && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {latestResponse.answeredQuestions} از {latestResponse.totalQuestions} سوال پاسخ داده شده
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </ScrollableArea>

      {/* Start Survey Confirmation Bottom Sheet */}
      <Drawer
        open={showStartConfirm}
        onClose={(open) => setShowStartConfirm(open)}
        side="bottom"
        size="md"
        closeOnBackdrop={true}
        closeOnEsc={true}
        panelClassName="rounded-t-2xl"
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <PiPlay className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                شروع نظرسنجی
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                آیا مطمئن هستید که می‌خواهید این نظرسنجی را شروع کنید؟
              </p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <PiWarning className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-6">
                  با شروع این نظرسنجی، می‌توانید به سوالات پاسخ دهید. در صورت وجود پاسخ فعال قبلی، به آن ادامه خواهید داد.
                </p>
              </div>
            </div>
            {participationStatus?.totalAttempts !== undefined && participationStatus?.maxAllowedAttempts !== undefined && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  تلاش‌های استفاده شده: <span className="font-semibold">{participationStatus.totalAttempts}</span> از <span className="font-semibold">{participationStatus.maxAllowedAttempts}</span>
                </p>
              </div>
            )}
          </div>
        </DrawerBody>
        <DrawerFooter className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="flex items-center gap-3">
          <Button
              variant="primary"
              size="md"
              block
              onClick={handleConfirmStart}
              loading={isStartingResponse}
              disabled={isStartingResponse}
              rightIcon={<PiPlay className="h-4 w-4" />}
            >
              شروع نظرسنجی
            </Button>
            <Button
              variant="ghost"
              size="md"
              block
              onClick={() => setShowStartConfirm(false)}
              disabled={isStartingResponse}
            >
              لغو
            </Button>
        
          </div>
        </DrawerFooter>
      </Drawer>

      {/* Start New Response Confirmation Bottom Sheet */}
      <Drawer
        open={showStartNewConfirm}
        onClose={(open) => setShowStartNewConfirm(open)}
        side="bottom"
        size="md"
        closeOnBackdrop={true}
        closeOnEsc={true}
        panelClassName="rounded-t-2xl"
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <PiWarning className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                شروع پاسخ جدید
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                آیا مطمئن هستید که می‌خواهید یک پاسخ جدید شروع کنید؟
              </p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <PiWarning className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-6">
                  شما در حال حاضر یک پاسخ فعال دارید. با شروع پاسخ جدید، یک تلاش جدید برای شما ثبت می‌شود. پاسخ قبلی شما همچنان قابل دسترسی خواهد بود.
                </p>
              </div>
            </div>
            {participationStatus?.totalAttempts !== undefined && participationStatus?.maxAllowedAttempts !== undefined && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  تلاش‌های استفاده شده: <span className="font-semibold">{participationStatus.totalAttempts}</span> از <span className="font-semibold">{participationStatus.maxAllowedAttempts}</span>
                </p>
                {participationStatus.totalAttempts >= participationStatus.maxAllowedAttempts - 1 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ این آخرین تلاش شما خواهد بود
                  </p>
                )}
              </div>
            )}
          </div>
        </DrawerBody>
        <DrawerFooter className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              block
              onClick={() => setShowStartNewConfirm(false)}
              disabled={isStartingResponse}
            >
              لغو
            </Button>
            <Button
              variant="primary"
              size="md"
              block
              onClick={handleConfirmStartNew}
              loading={isStartingResponse}
              disabled={isStartingResponse}
              rightIcon={<PiPlay className="h-4 w-4" />}
            >
              شروع پاسخ جدید
            </Button>
          </div>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}

