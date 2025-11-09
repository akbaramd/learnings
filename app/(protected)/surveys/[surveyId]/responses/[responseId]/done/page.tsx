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
import Drawer, { DrawerHeader, DrawerBody, DrawerFooter } from '@/src/components/overlays/Drawer';
import {
  PiCheckCircle,
  PiWarning,
  PiClipboardText,
  PiCheck,
} from 'react-icons/pi';

interface ResponseDonePageProps {
  params: Promise<{ surveyId: string; responseId: string }>;
}

const ReviewSkeleton = () => (
  <div className="h-full flex flex-col" dir="rtl">
    <PageHeader
      title="بررسی نهایی"
      titleIcon={<PiClipboardText className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      showBackButton={true}
      onBack={() => {}}
    />
    <ScrollableArea className="flex-1" hideScrollbar={true}>
      <div className="p-2 space-y-3 animate-pulse">
        <div className="h-24 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700" />
        <div className="space-y-3">
          <div className="h-6 w-28 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900 px-4 py-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="space-y-2 pl-9">
                <div className="h-9 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-9 rounded-lg bg-slate-200/80 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 flex-1 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </ScrollableArea>
  </div>
);

export default function ResponseDonePage({ params }: ResponseDonePageProps) {
  const router = useRouter();
  const [surveyIdFromParams, setSurveyIdFromParams] = useState<string>('');
  const [responseIdFromParams, setResponseIdFromParams] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmAgreed, setConfirmAgreed] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

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

  const handleOpenConfirm = useCallback(() => {
    setConfirmAgreed(false);
    setConfirmError(null);
    setIsConfirmOpen(true);
  }, []);

  const handleCloseConfirm = useCallback(() => {
    if (!isSubmitting) {
      setIsConfirmOpen(false);
      setConfirmError(null);
      setConfirmAgreed(false);
    }
  }, [isSubmitting]);

  // Handle submit response
  const handleFinalizeSubmit = useCallback(async () => {
    if (!confirmAgreed) {
      setConfirmError('لطفاً قوانین و مقررات را مطالعه کرده و تأیید کنید.');
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
        setIsConfirmOpen(false);
        router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}`);
      } else {
        setConfirmError(result.data?.message || 'خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.');
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      setConfirmError('خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.');
    }
  }, [confirmAgreed, surveyIdFromParams, responseIdFromParams, submitResponse, router]);

  const handleBack = () => {
    router.push(`/surveys/${surveyIdFromParams}/responses/${responseIdFromParams}`);
  };

  if ((isLoading || isDetailsLoading) && !responseDetails) {
    return <ReviewSkeleton />;
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
            <p className="text-body text-muted">پاسخ مورد نظر یافت نشد</p>
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
        titleIcon={<PiClipboardText className="h-5 w-5 text-accent" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-3">
          <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                <span className="px-2 py-0.5 bg-white/70 dark:bg-blue-900/40 rounded-full border border-blue-200 dark:border-blue-700">
                  بررسی نهایی
                </span>
                <span className="px-2 py-0.5 bg-white/60 dark:bg-blue-900/30 rounded-full border border-blue-200/80 dark:border-blue-700/70">
                  ارسال پاسخ
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                لطفاً پاسخ‌های خود را بررسی کنید. پس از تأیید، پاسخ شما ارسال خواهد شد و امکان ویرایش وجود ندارد.
              </p>
            </div>
          </Card>

          {/* Survey Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-heading-3 text-on-surface mb-2">
              اطلاعات نظرسنجی
            </h3>
            <div className="space-y-1">
              <div className="text-body text-muted">
                <span className="font-medium">عنوان:</span> {surveyTitle}
              </div>
              {responseDetails.attemptNumber && (
                <div className="text-body text-muted">
                  <span className="font-medium">تلاش شماره:</span> {responseDetails.attemptNumber}
                </div>
              )}
            </div>
          </Card>

          {/* Questions and Answers Review */}
          <div className="space-y-3">
            {questionAnswers.map((qa: QuestionAnswerDetailsDto, index: number) => {
              const question = qa.question;
              if (!question) return null;

              const questionText = question.text || `سوال ${index + 1}`;
              const questionNumber = question.order || index + 1;
              const isRequired = question.isRequired === true;
              const rawTextAnswer = qa.textAnswer?.trim();
              const selectedOptions = (qa.selectedOptions || []).filter(
                (option: QuestionOptionDto) => option && option.isActive !== false,
              );

              const hasSelectedOptions = selectedOptions.length > 0;
              const hasTextAnswer = !!rawTextAnswer && !hasSelectedOptions;

              return (
                <Card
                  key={question.id || `${questionNumber}-${index}`}
                  variant="default"
                  radius="lg"
                  padding="sm"
                  className="border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 rounded-full">
                          سوال {questionNumber}
                        </span>
                        {isRequired && (
                          <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-full border border-red-200/70 dark:border-red-700/60">
                            الزامی
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full text-right">
                        {questionText}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {hasSelectedOptions && (
                        <div className="flex flex-col gap-2">
                          {selectedOptions.map((option) => (
                            <span
                              key={option.id || option.text || `option-${questionNumber}`}
                              className="inline-flex items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-900 dark:text-gray-100"
                            >
                              <span className="truncate">{option.text || 'گزینه بدون عنوان'}</span>
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px]">
                                انتخاب شده
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {hasTextAnswer && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs leading-6 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {rawTextAnswer}
                        </div>
                      )}

                      {!hasSelectedOptions && !hasTextAnswer && (
                        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-xs italic text-gray-400 dark:text-gray-500">
                          بدون پاسخ ثبت‌شده
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              block
              onClick={handleBack}
              disabled={isSubmitting}
            >
              بازگشت
            </Button>
            <Button
              variant="solid"
              size="md"
              color="primary"
              block
              onClick={handleOpenConfirm}
              disabled={isSubmitting || isSubmitted}
              rightIcon={<PiCheckCircle className="h-4 w-4" />}
            >
              {isSubmitting ? 'در حال ارسال...' : isSubmitted ? 'ارسال شده' : 'تأیید و ارسال'}
            </Button>
          </div>
        </div>
      </ScrollableArea>

      <Drawer
        open={isConfirmOpen}
        onClose={(open) => {
          if (!open) {
            handleCloseConfirm();
          }
        }}
        side="bottom"
        size="md"
        closeOnBackdrop={!isSubmitting}
        panelClassName="rounded-t-2xl"
      >
        <DrawerHeader className="flex flex-col gap-1 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            تأیید نهایی ارسال پاسخ
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            لطفاً مفاد زیر را با دقت مطالعه کرده و تأیید کنید.
          </p>
        </DrawerHeader>
        <DrawerBody className="space-y-4 px-5 py-4 text-sm leading-6 text-gray-700 dark:text-gray-300">
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-800/60 rounded-xl px-3 py-2">
              با تأیید این مرحله، کلیه پاسخ‌های شما به صورت نهایی ثبت خواهند شد و پس از ارسال امکان ویرایش وجود ندارد.
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              لطفاً موارد زیر را با دقت مطالعه کنید:
            </p>
            <ul className="space-y-2 pr-4 list-disc text-xs text-gray-600 dark:text-gray-400">
              <li className="leading-5">
                تمامی پاسخ‌ها باید براساس اطلاعات صحیح و به‌روز تکمیل شده باشد و مسئولیت دقت آن بر عهده پاسخ‌دهنده است.
              </li>
              <li className="leading-5">
                قوانین و مقررات سازمانی مرتبط با این نظرسنجی رعایت شده و اطلاعات حساس مطابق دستورالعمل‌ها ثبت شده است.
              </li>
              <li className="leading-5">
                پس از ثبت نهایی، امکان ویرایش پاسخ‌ها وجود نخواهد داشت و نتیجه به صورت قطعی ذخیره می‌گردد.
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 shadow-sm transition hover:border-blue-200 dark:hover:border-blue-700">
            <input
              type="checkbox"
              checked={confirmAgreed}
              onChange={(e) => {
                setConfirmAgreed(e.target.checked);
                setConfirmError(null);
              }}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-5 sm:leading-6">
              مفاد بالا را مطالعه کرده و با ارسال نهایی پاسخ موافق هستم.
            </span>
          </label>

          {confirmError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              <PiWarning className="h-4 w-4 flex-shrink-0" />
              {confirmError}
            </div>
          )}
        </DrawerBody>
        <DrawerFooter className="pt-3 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button
            variant="solid"
            size="md"
            block
            onClick={handleFinalizeSubmit}
            disabled={isSubmitting || !confirmAgreed}
            loading={isSubmitting}
            rightIcon={<PiCheckCircle className="h-4 w-4" />}
          >
            ثبت نهایی پاسخ
          </Button>
          <Button
            variant="outline"
            size="md"
            block
            onClick={handleCloseConfirm}
            disabled={isSubmitting}
          >
            انصراف
          </Button>
        
        </DrawerFooter>
      </Drawer>
    </div>
  );
}

