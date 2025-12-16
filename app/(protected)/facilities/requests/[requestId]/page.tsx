'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetFacilityRequestDetailsQuery,
  selectSelectedRequest,
  selectFacilitiesLoading,
} from '@/src/store/facilities';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import {
  PiFileText,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiWarningCircle,
  PiListChecks,
  PiArrowCounterClockwise,
  PiBuilding,
  PiCalendarCheck,
  PiInfo,
  PiClipboardText,
  PiBuildings,
  PiArrowRight,
  PiSparkle,
} from 'react-icons/pi';

interface RequestDetailPageProps {
  params: Promise<{ requestId: string }>;
}

function formatCurrencyFa(amount: number | null | undefined): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0';
  }
}

function formatDateFa(date: Date | string | null | undefined): string {
  if (!date) return 'نامشخص';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'نامشخص';

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'نامشخص';
  }
}

function getStatusInfo(status: string | null | undefined) {
  const statusMap: Record<string, {
    icon: React.ReactNode;
    label: string;
    badgeClass: string;
    description: string;
  }> = {
    'RequestSent': {
      icon: <PiFileText className="h-5 w-5 text-blue-500" />,
      label: 'ارسال شده',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      description: 'درخواست شما با موفقیت ارسال شده و در انتظار بررسی اولیه است. لطفاً صبور باشید.',
    },
    'PendingApproval': {
      icon: <PiClock className="h-5 w-5 text-amber-500" />,
      label: 'در انتظار تایید',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      description: 'درخواست شما در صف بررسی و تایید قرار دارد. این فرآیند ممکن است چند روز کاری طول بکشد.',
    },
    'PendingDocuments': {
      icon: <PiFileText className="h-5 w-5 text-orange-500" />,
      label: 'در انتظار مدارک',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      description: 'لطفاً مدارک مورد نیاز را ارسال کنید. درخواست شما پس از دریافت و بررسی مدارک، ادامه فرآیند بررسی را خواهد داشت.',
    },
    'Waitlisted': {
      icon: <PiListChecks className="h-5 w-5 text-purple-500" />,
      label: 'در لیست انتظار',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      description: 'درخواست شما در لیست انتظار قرار دارد. در صورت آزاد شدن ظرفیت، درخواست شما بررسی خواهد شد.',
    },
    'ReturnedForAmendment': {
      icon: <PiArrowCounterClockwise className="h-5 w-5 text-yellow-500" />,
      label: 'بازگشت برای اصلاح',
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      description: 'درخواست شما نیاز به اصلاح دارد. لطفاً موارد اعلام شده را اصلاح کرده و مجدداً ارسال کنید.',
    },
    'UnderReview': {
      icon: <PiClock className="h-5 w-5 text-indigo-500" />,
      label: 'در حال بررسی',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      description: 'درخواست شما در حال بررسی دقیق توسط کارشناسان است. نتیجه بررسی به زودی اعلام خواهد شد.',
    },
    'Approved': {
      icon: <PiCheckCircle className="h-5 w-5 text-green-500" />,
      label: 'تایید شده',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      description: 'درخواست شما با موفقیت تایید شده است. مراحل بعدی به شما اطلاع‌رسانی خواهد شد.',
    },
    'QueuedForDispatch': {
      icon: <PiCheckCircle className="h-5 w-5 text-teal-500" />,
      label: 'در صف ارسال به بانک',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
      description: 'درخواست شما تایید شده و در صف ارسال به بانک قرار دارد. به زودی به بانک ارسال خواهد شد.',
    },
    'SentToBank': {
      icon: <PiBuilding className="h-5 w-5 text-cyan-500" />,
      label: 'ارسال شده به بانک',
      badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
      description: 'درخواست شما به بانک ارسال شده است. بانک در حال بررسی و پردازش درخواست شماست.',
    },
    'BankScheduled': {
      icon: <PiCalendarCheck className="h-5 w-5 text-emerald-500" />,
      label: 'زمان‌بندی شده در بانک',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      description: 'بانک زمان ویزیت را برای شما تعیین کرده است. لطفاً در زمان مشخص شده به بانک مراجعه کنید.',
    },
    'ProcessedByBank': {
      icon: <PiCheckCircle className="h-5 w-5 text-green-600" />,
      label: 'پردازش شده توسط بانک',
      badgeClass: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200',
      description: 'بانک درخواست شما را پردازش کرده است. تسهیلات به زودی برای شما واریز خواهد شد.',
    },
    'Rejected': {
      icon: <PiXCircle className="h-5 w-5 text-red-500" />,
      label: 'رد شده',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      description: 'متأسفانه درخواست شما رد شده است. در صورت نیاز می‌توانید مجدداً درخواست دهید.',
    },
    'Cancelled': {
      icon: <PiXCircle className="h-5 w-5 text-gray-500" />,
      label: 'لغو شده',
      badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
      description: 'این درخواست لغو شده است. در صورت نیاز می‌توانید درخواست جدیدی ثبت کنید.',
    },
    'Expired': {
      icon: <PiWarningCircle className="h-5 w-5 text-orange-500" />,
      label: 'منقضی شده',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      description: 'مهلت این درخواست به پایان رسیده است. در صورت نیاز می‌توانید درخواست جدیدی ثبت کنید.',
    },
  };

  return statusMap[status || ''] || {
    icon: <PiWarning className="h-5 w-5 text-gray-500" />,
    label: status || 'نامشخص',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    description: 'وضعیت درخواست نامشخص است.',
  };
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const router = useRouter();
  const [requestIdFromParams, setRequestIdFromParams] = useState<string>('');

  // Redux selectors
  const isLoading = useSelector(selectFacilitiesLoading);
  const request = useSelector(selectSelectedRequest);

  // Query hook
  const [getRequestDetails] = useLazyGetFacilityRequestDetailsQuery();

  // Get request ID from params
  useEffect(() => {
    params.then(({ requestId }) => {
      setRequestIdFromParams(requestId);
    });
  }, [params]);

  // Fetch request details
  useEffect(() => {
    if (requestIdFromParams) {
      getRequestDetails(requestIdFromParams);
    }
  }, [requestIdFromParams, getRequestDetails]);

  const handleBack = useCallback(() => {
    router.push('/facilities/requests');
  }, [router]);

  if (isLoading && !request) {
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

  if (!request) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="درخواست یافت نشد"
          showBackButton={true}
          onBack={handleBack}
        />
        <ScrollableArea className="flex-1">
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500">درخواست مورد نظر یافت نشد</p>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="جزئیات درخواست"
        titleIcon={<PiFileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2 space-y-2">
          {/* Status Card - Enhanced UI/UX */}
          <Card variant="default" radius="lg" padding="md" className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800/80 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      {getStatusInfo(request.status).icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                      {getStatusInfo(request.status).label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      شناسه: {request.id?.substring(0, 8)}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusInfo(request.status).badgeClass}`}>
                  {getStatusInfo(request.status).label}
                </span>
              </div>
              
              {/* Status Description */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <PiInfo className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {getStatusInfo(request.status).description}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Request Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              اطلاعات درخواست
            </h3>
            <div className="space-y-3">
              {request.createdAt && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاریخ ایجاد</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDateFa(request.createdAt)}
                  </div>
                </div>
              )}
              {request.requestedAmountRials && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">مبلغ درخواستی</div>
                  <div className="text-md font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrencyFa(request.requestedAmountRials)} ریال
                  </div>
                </div>
              )}
              {request.approvedAmountRials && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">مبلغ تایید شده</div>
                  <div className="text-md font-semibold text-green-600 dark:text-green-400">
                    {formatCurrencyFa(request.approvedAmountRials)} ریال
                  </div>
                </div>
              )}
              {request.description && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">توضیحات</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {request.description}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Facility Info */}
          {request.facility?.name && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                اطلاعات تسهیلات
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">نام تسهیلات</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {request.facility.name || request.facility.code || 'نامشخص'}
                  </div>
                </div>
                {request.cycle?.name && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">دوره</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.cycle?.name}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Approval Success Card - Simple Message */}
          {(request.status === 'Approved' || request.isCompleted) && (
            <Card variant="default" radius="lg" padding="md" className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10">
              <div className="flex items-start gap-3">
                <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    لطفاً منتظر بمانید. در آخر دوره، لیست پذیرفته شدگان به بانک ارسال می‌شود و وضعیت دوره به «ارسال شده به بانک» تغییر می‌کند.
                  </p>
                </div>
              </div>
            </Card>
          )}
          
          {/* Rejection Details Card - Modern & Minimal */}
          {(request.status === 'Rejected' || request.isRejected) && (
            <Card variant="default" radius="lg" padding="md" className="border-red-200 dark:border-red-800/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    درخواست رد شده
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    رد شده
                  </span>
                </div>
                
                {/* Rejection Reason */}
                {request.rejectionReasonDetails && (
                  <div className="space-y-3 mb-4">
                    {request.rejectionReasonDetails.name && (
                      <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          دلیل رد درخواست
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {request.rejectionReasonDetails.name}
                        </div>
                      </div>
                    )}
                    {request.rejectionReasonDetails.reason && (
                      <div className="bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          توضیحات
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {request.rejectionReasonDetails.reason}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Rejection Description */}
                {request.rejectionDescription && (
                  <div className="mb-4 bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      توضیحات تکمیلی
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {request.rejectionDescription}
                    </div>
                  </div>
                )}

                {/* Fallback if no detailed info */}
                {!request.rejectionReasonDetails && !request.rejectionDescription && request.rejectionReason && (
                  <div className="mb-4 bg-white dark:bg-gray-800/80 rounded-lg p-4 border border-red-200 dark:border-red-800/50 shadow-sm">
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {request.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800/50">
                  <div className="flex items-start gap-2">
                    <PiWarningCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                        توجه مهم
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                        متأسفانه درخواست شما در این دوره رد شده است. در این دوره دیگر نمی‌توانید درخواست جدیدی ثبت کنید. لطفاً منتظر بمانید تا دوره‌های بعدی شروع شوند.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rejection Date */}
                {request.rejectedAt && (
                  <div className="pt-3 border-t border-red-200 dark:border-red-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <PiClock className="h-3.5 w-3.5" />
                      <span>تاریخ رد: {formatDateFa(request.rejectedAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Documents Action Card - Enhanced UI/UX */}
          {(request.status === 'PendingDocuments' || 
            (request.requiresApplicantAction && request.statusDetails?.requiresApplicantAction)) && (
            <Card variant="default" radius="lg" padding="md" className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/10 dark:via-orange-900/10 dark:to-yellow-900/10">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-sm">
                      <PiClipboardText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        تکمیل مدارک مورد نیاز
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        اقدام لازم
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      برای ادامه فرآیند بررسی درخواست، لازم است مدارک مورد نیاز را تکمیل و ارسال کنید.
                    </p>
                    
                    {/* Action Instructions - Modern Card Design */}
                    <div className="bg-white dark:bg-gray-800/80 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50 shadow-sm space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                            <PiBuildings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              مراجعه به سازمان
                            </div>
                            <PiArrowRight className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            لطفاً به سازمان مربوطه مراجعه کرده و مدارک مورد نیاز را تکمیل و ارسال کنید.
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-amber-100 dark:border-amber-800/30">
                        <div className="flex items-start gap-2.5">
                          <PiInfo className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                              <span className="font-medium text-gray-700 dark:text-gray-300">نکته:</span> پس از تکمیل و ارسال مدارک، درخواست شما مجدداً بررسی خواهد شد و نتیجه به شما اطلاع‌رسانی می‌شود.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

         
        </div>
      </ScrollableArea>
    </div>
  );
}

