'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PiClipboardText, PiCheckCircle, PiClock } from 'react-icons/pi';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

/* ===================== Types ===================== */

export type Survey = {
  id?: string;
  title?: string | null;
  description?: string | null;
  state?: string | null;
  stateText?: string | null;
  isActive?: boolean;
  isAcceptingResponses?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  totalQuestions?: number;
  requiredQuestions?: number;
  hasUserResponse?: boolean;
  canUserParticipate?: boolean;
  userAttemptCount?: number;
  remainingAttempts?: number;
  responseCount?: number;
  durationText?: string | null;
  timeRemainingText?: string | null;
  isExpired?: boolean;
  isScheduled?: boolean;
};

type SurveyCardProps = {
  survey: Survey;
  className?: string;
  /** اگر true باشد حالت لودینگ اسکلتی رندر می‌شود */
  loading?: boolean;
  /** برای RTL/LTR بدون وابستگی به والد (اختیاری) */
  dir?: 'rtl' | 'ltr';
};

/* ===================== Utils (i18n/fa, formatting) ===================== */

const faDigits = (input: string | number) =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const formatDateRangeFa = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 'نامشخص';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'نامشخص';
  const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    month: 'short',
    day: 'numeric',
  });
  return `${fmt.format(s)} تا ${fmt.format(e)}`;
};

/* ===================== Skeleton ===================== */

export function SurveyCardSkeleton({ className, dir }: { className?: string; dir?: 'rtl'|'ltr' }) {
  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="md"
      className={['animate-pulse w-full overflow-hidden', className || ''].join(' ')}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>
        <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    </Card>
  );
}

/* ===================== SurveyCard ===================== */

export function SurveyCard({
  survey,
  className,
  loading,
  dir,
}: SurveyCardProps) {
  const router = useRouter();
  if (loading) {
    return <SurveyCardSkeleton className={className} dir={dir} />;
  }

  const isActive = survey.isActive || false;
  const isAcceptingResponses = survey.isAcceptingResponses || false;
  const hasUserResponse = survey.hasUserResponse || false;
  const canUserParticipate = survey.canUserParticipate || false;
  const displayTitle = survey.title || 'بدون عنوان';

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (survey.id) {
      router.push(`/surveys/${survey.id}`);
    }
  };

  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="md"
      hover={true}
      className={[
        'group w-full h-full flex flex-col text-right',
        'hover:border-amber-300/40 dark:hover:border-amber-400/40',
        className || '',
      ].join(' ')}
    >
      {/* Header: Icon + Title + Badges */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-700/50">
            <PiClipboardText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-md font-bold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2 mb-1.5">
            {displayTitle}
          </h3>
          {survey.stateText && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                وضعیت
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {survey.stateText}
              </span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
          {isActive && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-600 text-white shadow-sm">
              <PiCheckCircle className="h-3 w-3 inline ml-1" />
              فعال
            </span>
          )}
          {isAcceptingResponses && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-600 text-white shadow-sm">
              پذیرش پاسخ
            </span>
          )}
          {hasUserResponse && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white shadow-sm">
              پاسخ داده شده
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {survey.description && (
        <div className="mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {survey.description}
          </p>
        </div>
      )}

      {/* Survey Info */}
      <div className="mb-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-3 gap-3 text-center">
          {survey.totalQuestions !== undefined && (
            <div className="border-l border-neutral-200 dark:border-neutral-700 pl-3">
              <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                کل سوالات
              </div>
              <div className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                {faDigits(survey.totalQuestions)}
              </div>
            </div>
          )}
          {survey.requiredQuestions !== undefined && (
            <div className="border-l border-neutral-200 dark:border-neutral-700 pl-3">
              <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                اجباری
              </div>
              <div className="font-bold text-orange-700 dark:text-orange-400 text-sm">
                {faDigits(survey.requiredQuestions)}
              </div>
            </div>
          )}
          {survey.responseCount !== undefined && (
            <div>
              <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                پاسخ‌ها
              </div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {faDigits(survey.responseCount)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Info */}
      {(survey.startAt || survey.endAt || survey.durationText || survey.timeRemainingText) && (
        <div className="mb-4 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <PiClock className="w-4 h-4" />
          <span>
            {survey.timeRemainingText || survey.durationText || formatDateRangeFa(survey.startAt, survey.endAt)}
          </span>
        </div>
      )}

      {/* Attempts Info */}
      {survey.remainingAttempts !== undefined && survey.remainingAttempts > 0 && (
        <div className="mb-4 text-xs text-neutral-600 dark:text-neutral-400">
          <span>تلاش باقی‌مانده: </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {faDigits(survey.remainingAttempts)}
          </span>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleButtonClick}
        variant={canUserParticipate && isAcceptingResponses ? 'solid' : 'outline'}
        color={canUserParticipate && isAcceptingResponses ? 'primary' : 'secondary'}
        className="mt-auto w-full font-semibold"
      >
        {hasUserResponse 
          ? 'مشاهده پاسخ' 
          : canUserParticipate && isAcceptingResponses
          ? 'شرکت در نظرسنجی'
          : 'مشاهده جزئیات'}
      </Button>
    </Card>
  );
}

