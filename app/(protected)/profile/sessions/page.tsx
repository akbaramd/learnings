'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetSessionsPaginatedQuery } from '@/src/store/auth/auth.queries';
import { getDeviceId } from '@/src/lib/deviceInfo';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { PageHeader } from '@/src/components/ui/PageHeader/PageHeader';
import { SessionDto } from '@/src/store/auth/auth.types';
import {
  PiDeviceMobile,
  PiGlobe,
  PiClock,
  PiCheckCircle,
  PiXCircle,
  PiWarning,
  PiArrowClockwise,
} from 'react-icons/pi';

function formatRelativeFa(date: Date | string | null) {
  if (!date) return 'نامشخص';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'نامشخص';
    
    const diff = Date.now() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'هم‌اکنون';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${days} روز پیش`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'نامشخص';
  }
}

function getStatusInfo(session: SessionDto) {
  if (session.isRevoked) {
    return {
      icon: PiXCircle,
      text: 'لغو شده',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800'
    };
  }
  if (session.isExpired) {
    return {
      icon: PiClock,
      text: 'منقضی شده',
      color: 'text-gray-600 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      borderColor: 'border-gray-200 dark:border-gray-700'
    };
  }
  if (session.isActive) {
    return {
      icon: PiCheckCircle,
      text: 'فعال',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800'
    };
  }
  return {
    icon: PiClock,
    text: 'نامشخص',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-700'
  };
}

function SessionCard({ 
  session, 
  isCurrentDevice 
}: { 
  session: SessionDto; 
  isCurrentDevice: boolean;
}) {
  const statusInfo = getStatusInfo(session);

  return (
    <Card
      variant="default"
      radius="lg"
      padding="md"
      hover={false}
      clickable={false}
      className={`
        ${isCurrentDevice 
          ? 'border-2 border-emerald-500 dark:border-emerald-400 shadow-lg' 
          : ''
        }
      `}
    >
      {/* Device ID and Status Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PiDeviceMobile className={`h-5 w-5 ${isCurrentDevice ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
          <div>
            <div className={`text-sm font-semibold ${isCurrentDevice ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'}`}>
              {isCurrentDevice ? 'دستگاه فعلی' : (session.deviceId || 'دستگاه ناشناس')}
            </div>
            {session.userAgent && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {session.userAgent.length > 40 
                  ? session.userAgent.substring(0, 40) + '...' 
                  : session.userAgent
                }
              </div>
            )}
          </div>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
      </div>

      {/* IP Address Row */}
      {session.ipAddress && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <PiGlobe className="h-3.5 w-3.5" />
          <span>{session.ipAddress}</span>
        </div>
      )}

      {/* Last Activity Row */}
      {session.lastActivityAt && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          آخرین فعالیت: {formatRelativeFa(session.lastActivityAt)}
        </div>
      )}

      {/* Risk Score Warning */}
      {session.riskScore !== undefined && session.riskScore > 0 && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <PiWarning className="h-3.5 w-3.5" />
            <span>امتیاز ریسک: {session.riskScore}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  // Get current device ID on mount (using useState initializer to avoid setState in effect)
  const [currentDeviceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return getDeviceId();
    }
    return null;
  });
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useGetSessionsPaginatedQuery({
    pageNumber,
    pageSize,
  });

  const sessions = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasError = error !== undefined && error !== null;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <PageHeader
        title="دستگاه‌ها و نشست‌ها"
        titleIcon={<PiDeviceMobile className="h-5 w-5" />}
        showBackButton={true}
        onBack={handleBack}
        rightActions={[
          {
            icon: <PiArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />,
            onClick: handleRefresh,
            label: 'بروزرسانی',
            disabled: isLoading,
            'aria-label': 'بروزرسانی',
          },
        ]}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-2">
          {hasError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <span className="text-sm">خطا در بارگذاری نشست‌ها. لطفاً دوباره تلاش کنید.</span>
              </div>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {/* Sessions List */}
          {isLoading ? (
            <Card variant="default" radius="lg" padding="lg">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            </Card>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCurrentDevice={session.deviceId === currentDeviceId}
                />
              ))}
            </div>
          ) : (
            <Card variant="default" radius="lg" padding="lg">
              <div className="text-center">
                <PiDeviceMobile className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">هیچ نشستی یافت نشد</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">هنوز هیچ نشست فعالی وجود ندارد</p>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {!isLoading && sessions && sessions.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                قبلی
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                صفحه {pageNumber} از {totalPages}
              </span>
              
              <button
                onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                disabled={pageNumber === totalPages}
                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                بعدی
              </button>
            </div>
          )}

          {/* Info */}
          {!isLoading && sessions && sessions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>نکته:</strong> دستگاه فعلی با حاشیه سبز مشخص شده است.
              </p>
            </div>
          )}
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </ScrollableArea>
    </div>
  );
}

