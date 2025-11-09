'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PiMoney, PiCheckCircle } from 'react-icons/pi';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

/* ===================== Types ===================== */

export type Facility = {
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  hasActiveCycles?: boolean;
  isAcceptingApplications?: boolean;
  cycleStatistics?: {
    totalActiveQuota?: number;
    totalAvailableQuota?: number;
    totalCyclesCount?: number;
  };
};

type FacilityCardProps = {
  facility: Facility;
  className?: string;
  /** اگر true باشد حالت لودینگ اسکلتی رندر می‌شود */
  loading?: boolean;
  /** برای RTL/LTR بدون وابستگی به والد (اختیاری) */
  dir?: 'rtl' | 'ltr';
};

/* ===================== Utils (i18n/fa, formatting) ===================== */

const faDigits = (input: string | number) =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const formatCurrencyFa = (amount: number | null | undefined): string => {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return '0';
  }
};

/* ===================== Skeleton ===================== */

export function FacilityCardSkeleton({ className, dir }: { className?: string; dir?: 'rtl'|'ltr' }) {
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

/* ===================== FacilityCard ===================== */

export function FacilityCard({
  facility,
  className,
  loading,
  dir,
}: FacilityCardProps) {
  const router = useRouter();
  if (loading) {
    return <FacilityCardSkeleton className={className} dir={dir} />;
  }

  const hasActiveCycles = facility.hasActiveCycles || false;
  const isAcceptingApplications = facility.isAcceptingApplications || false;
  const displayName = facility.name || facility.code || 'نامشخص';

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (facility.id) {
      router.push(`/facilities/${facility.id}`);
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
        'hover:border-emerald-300/40 dark:hover:border-emerald-400/40',
        className || '',
      ].join(' ')}
    >
      {/* Header: Icon + Title + Badges */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-700/50">
            <PiMoney className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Title + Code */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2 mb-1.5">
            {displayName}
          </h3>
          {facility.code && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                کد
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                {facility.code}
              </span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
          {hasActiveCycles && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-600 text-white shadow-sm">
              <PiCheckCircle className="h-3 w-3 inline ml-1" />
              فعال
            </span>
          )}
          {isAcceptingApplications && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white shadow-sm">
              پذیرش درخواست
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {facility.description && (
        <div className="mb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {facility.description}
          </p>
        </div>
      )}

      {/* Cycle Statistics Info */}
      {facility.cycleStatistics && (
        (facility.cycleStatistics.totalActiveQuota !== undefined || 
         facility.cycleStatistics.totalAvailableQuota !== undefined || 
         facility.cycleStatistics.totalCyclesCount !== undefined) && (
          <div className="mb-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-3 gap-3 text-center">
              {facility.cycleStatistics.totalActiveQuota !== undefined && (
                <div className="border-l border-neutral-200 dark:border-neutral-700 pl-3">
                  <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                    ظرفیت فعال
                  </div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {formatCurrencyFa(facility.cycleStatistics.totalActiveQuota)}
                  </div>
                </div>
              )}
              {facility.cycleStatistics.totalAvailableQuota !== undefined && (
                <div className="border-l border-neutral-200 dark:border-neutral-700 pl-3">
                  <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                    ظرفیت موجود
                  </div>
                  <div className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                    {formatCurrencyFa(facility.cycleStatistics.totalAvailableQuota)}
                  </div>
                </div>
              )}
              {facility.cycleStatistics.totalCyclesCount !== undefined && (
                <div>
                  <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                    کل دوره‌ها
                  </div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {faDigits(facility.cycleStatistics.totalCyclesCount)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Action Button */}
      <Button
        onClick={handleButtonClick}
        variant={isAcceptingApplications ? 'solid' : 'outline'}
        color={isAcceptingApplications ? 'primary' : 'secondary'}
        className="mt-auto w-full font-semibold"
      >
        {isAcceptingApplications ? 'جزئیات و درخواست' : 'مشاهده جزئیات'}
      </Button>
    </Card>
  );
}
