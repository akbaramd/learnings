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
import VideoTutorialDrawer from '@/src/components/overlays/VideoTutorialDrawer';
import {
  PiClipboardText,
  PiArrowRight,
  PiFileText,
  PiPlay,
  PiList,
  PiWarning,
  PiPlayCircle,
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
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);

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
  const canceledAttempts = userSurveyResponses?.canceledAttempts || 0;
  const expiredAttempts = userSurveyResponses?.expiredAttempts || 0;
  
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
            <p className="text-body text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
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
            <p className="text-body text-gray-500 dark:text-gray-400">نظرسنجی مورد نظر یافت نشد</p>
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
 

          {/* Simple Start Button */}
          {canStart && hasAttemptsAvailable && (
            <Card variant="default" radius="lg" padding="md" className="flex flex-col gap-2 items-center justify-between">
              {hasActiveResponse && !isLatestResponseCompleted ? (
                <div className="space-y-3">
                  <Button
                    variant="solid"
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
                    variant="outline"
                    size="md"
                    block
                    onClick={() => setShowStartNewConfirm(true)}
                    disabled={isStartingResponse}
                    rightIcon={<PiPlay className="h-4 w-4" />}
                  >
                    {isStartingResponse ? 'در حال شروع...' : 'شروع پاسخ جدید'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="solid"
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
                <Button
              variant="subtle"
              size="md"
              block
              onClick={() => setShowVideoTutorial(true)}
              leftIcon={<PiPlayCircle className="h-4 w-4" />}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              آموزش ویدویی
            </Button>
            </Card>
          )}

          {/* Basic Info - With Title */}
          {(surveyTitle || surveyDescription) && (
            <Card variant="default" radius="lg" padding="md">
              {surveyTitle && (
                <h3 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-2">
                  {surveyTitle}
                </h3>
              )}
              {surveyDescription && (
                <div className={surveyTitle ? 'mt-3' : ''}>
                  <div className="text-caption text-gray-500 dark:text-gray-400 mb-1.5">توضیحات</div>
                  <p className="text-body text-gray-700 dark:text-gray-300">
                    {surveyDescription}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Compact Stats Card */}
          {(totalAttempts > 0 || participationStatus?.totalAttempts !== undefined || hasActiveResponse) && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-3">
                آمار مشارکت شما
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Total Attempts */}
                {(totalAttempts > 0 || participationStatus?.totalAttempts !== undefined) && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">کل تلاش‌ها</div>
                    <div className="text-body font-bold text-gray-900 dark:text-gray-100">
                      {participationStatus?.totalAttempts ?? totalAttempts}
                      {participationStatus?.maxAllowedAttempts && (
                        <span className="text-secondary font-normal text-gray-500 dark:text-gray-400 mr-1">
                          از {participationStatus.maxAllowedAttempts}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Completed Attempts */}
                {completedAttempts > 0 && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">تکمیل شده</div>
                    <div className="text-body font-bold text-green-600 dark:text-green-400">
                      {completedAttempts}
                    </div>
                  </div>
                )}

                {/* Active Attempts */}
                {activeAttempts > 0 && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">فعال</div>
                    <div className="text-body font-bold text-blue-600 dark:text-blue-400">
                      {activeAttempts}
                    </div>
                  </div>
                )}

                {/* Remaining Attempts */}
                {participationStatus?.maxAllowedAttempts !== undefined && participationStatus?.totalAttempts !== undefined && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">باقی‌مانده</div>
                    <div className="text-body font-bold text-amber-600 dark:text-amber-400">
                      {Math.max(0, participationStatus.maxAllowedAttempts - participationStatus.totalAttempts)}
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                {hasActiveResponse && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">وضعیت</div>
                    <div className="text-caption font-semibold text-blue-600 dark:text-blue-400">
                      پاسخ فعال دارید
                    </div>
                  </div>
                )}

                {/* Can Start Badge */}
                {canStart && !hasActiveResponse && (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-caption text-gray-500 dark:text-gray-400 mb-1">وضعیت</div>
                    <div className="text-caption font-semibold text-green-600 dark:text-green-400">
                      قابل شروع
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info Row */}
              {(canceledAttempts > 0 || expiredAttempts > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-caption text-gray-500 dark:text-gray-400">
                    {canceledAttempts > 0 && (
                      <span>لغو شده: <span className="font-semibold text-gray-700 dark:text-gray-300">{canceledAttempts}</span></span>
                    )}
                    {expiredAttempts > 0 && (
                      <span>منقضی شده: <span className="font-semibold text-gray-700 dark:text-gray-300">{expiredAttempts}</span></span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* User Responses */}
          {responses.length > 0 && (
            <Card variant="default" radius="lg" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-heading-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PiFileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  پاسخ‌های شما
                </h3>
                {responses.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewResponses}
                  >
                    مشاهده همه ({responses.length})
                  </Button>
                )}
              </div>
              
              {isResponsesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-secondary text-gray-500 dark:text-gray-400">در حال بارگذاری پاسخ‌ها...</p>
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
                              <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                                تلاش شماره {response.attemptNumber || 1}
                              </span>
                              {isSubmitted && (
                                <span className="px-2 py-0.5 rounded-full text-caption font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  ارسال شده
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-caption text-gray-500 dark:text-gray-400">
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

        </div>
      </ScrollableArea>

      {/* Start Survey - Step by Step Guide */}
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
              <h3 className="text-heading-3 text-gray-900 dark:text-gray-100">
                راهنمای پاسخ به نظرسنجی
              </h3>
              <p className="text-caption text-gray-500 dark:text-gray-400 mt-0.5">
                مراحل پاسخ به سوالات
              </p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-caption font-semibold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div className="flex-1">
                <h4 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-1">
                  شروع نظرسنجی
                </h4>
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  با کلیک روی دکمه شروع، نظرسنجی برای شما فعال می‌شود.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-caption font-semibold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <div className="flex-1">
                <h4 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-1">
                  پاسخ به سوالات
                </h4>
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  به هر سوال به ترتیب پاسخ دهید. می‌توانید بین سوالات جابجا شوید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-caption font-semibold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <div className="flex-1">
                <h4 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-1">
                  بررسی پاسخ‌ها
                </h4>
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  قبل از ارسال نهایی، تمام پاسخ‌های خود را بررسی کنید.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-caption font-semibold text-green-600 dark:text-green-400">4</span>
              </div>
              <div className="flex-1">
                <h4 className="text-heading-3 text-gray-900 dark:text-gray-100 mb-1">
                  تایید و ارسال
                </h4>
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  در پایان، پاسخ‌های خود را تایید کرده و ارسال کنید.
                </p>
              </div>
            </div>

            {participationStatus?.totalAttempts !== undefined && participationStatus?.maxAllowedAttempts !== undefined && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mt-4">
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  تلاش‌های استفاده شده: <span className="font-semibold">{participationStatus.totalAttempts}</span> از <span className="font-semibold">{participationStatus.maxAllowedAttempts}</span>
                </p>
              </div>
            )}
          </div>
        </DrawerBody>
        <DrawerFooter className="pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="flex items-center gap-3">
            <Button
              variant="subtle"
              size="md"
              block
              onClick={() => setShowStartConfirm(false)}
              disabled={isStartingResponse}
            >
              لغو
            </Button>
            <Button
              variant="solid"
              size="md"
              block
              onClick={handleConfirmStart}
              loading={isStartingResponse}
              disabled={isStartingResponse}
              rightIcon={<PiPlay className="h-4 w-4" />}
            >
              شروع نظرسنجی
            </Button>
          </div>
        </DrawerFooter>
      </Drawer>

      {/* Start New Response - Step by Step Guide */}
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
              <h3 className="text-heading-3 text-gray-900 dark:text-gray-100">
                شروع پاسخ جدید
              </h3>
              <p className="text-caption text-gray-500 dark:text-gray-400 mt-0.5">
                شما یک پاسخ فعال دارید
              </p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <PiWarning className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-body text-gray-700 dark:text-gray-300">
                  شما در حال حاضر یک پاسخ فعال دارید. با شروع پاسخ جدید، یک تلاش جدید برای شما ثبت می‌شود. پاسخ قبلی شما همچنان قابل دسترسی خواهد بود.
                </p>
              </div>
            </div>

            {/* Step by Step Guide */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    شروع پاسخ جدید
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    پاسخ به سوالات به ترتیب
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    بررسی پاسخ‌ها
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">4</span>
                </div>
                <div className="flex-1">
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    تایید و ارسال نهایی
                  </p>
                </div>
              </div>
            </div>

            {participationStatus?.totalAttempts !== undefined && participationStatus?.maxAllowedAttempts !== undefined && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mt-4">
                <p className="text-caption text-gray-600 dark:text-gray-400">
                  تلاش‌های استفاده شده: <span className="font-semibold">{participationStatus.totalAttempts}</span> از <span className="font-semibold">{participationStatus.maxAllowedAttempts}</span>
                </p>
                {participationStatus.totalAttempts >= participationStatus.maxAllowedAttempts - 1 && (
                  <p className="text-caption text-orange-600 dark:text-orange-400 mt-1">
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
              variant="subtle"
              size="md"
              block
              onClick={() => setShowStartNewConfirm(false)}
              disabled={isStartingResponse}
            >
              لغو
            </Button>
            <Button
              variant="solid"
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

      {/* Video Tutorial Drawer */}
      <VideoTutorialDrawer
        open={showVideoTutorial}
        onClose={setShowVideoTutorial}
        title="آموزش ویدویی پاسخ به سوالات"
        subtitle="راهنمای تصویری نحوه پاسخ به سوالات نظرسنجی"
      />
    </div>
  );
}

