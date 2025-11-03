'use client';

import React, { useEffect, useState } from 'react';
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

function getStatusIcon(status: string | null | undefined) {
  switch (status) {
    case 'Approved':
      return <PiCheckCircle className="h-5 w-5 text-green-500" />;
    case 'Pending':
    case 'UnderReview':
      return <PiClock className="h-5 w-5 text-amber-500" />;
    case 'Rejected':
    case 'Cancelled':
      return <PiXCircle className="h-5 w-5 text-red-500" />;
    case 'Expired':
      return <PiWarning className="h-5 w-5 text-orange-500" />;
    default:
      return <PiWarning className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'Pending': 'در انتظار',
    'UnderReview': 'در حال بررسی',
    'Approved': 'تایید شده',
    'Rejected': 'رد شده',
    'Cancelled': 'لغو شده',
    'Expired': 'منقضی شده'
  };
  return labels[status || ''] || status || 'نامشخص';
}

function getStatusBadgeClass(status: string | null | undefined) {
  const badgeMap: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'UnderReview': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Cancelled': 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
    'Expired': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  };
  return badgeMap[status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
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

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/facilities')) {
      router.back();
    } else {
      router.push('/facilities/requests');
    }
  };

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
          {/* Status Card */}
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(request.status)}
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {getStatusLabel(request.status)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {request.id?.substring(0, 8)}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
          </Card>

          {/* Request Info */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrencyFa(request.requestedAmountRials)} ریال
                  </div>
                </div>
              )}
              {request.approvedAmountRials && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">مبلغ تایید شده</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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

         
        </div>
      </ScrollableArea>
    </div>
  );
}

