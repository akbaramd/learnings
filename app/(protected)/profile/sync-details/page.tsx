'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useGetCurrentMemberQuery, useSyncCurrentMemberMutation } from '@/src/store/members';
import { RootState } from '@/src/store';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Button } from '@/src/components/ui/Button';
import {
  PiArrowClockwise,
  PiCheckCircle,
  PiXCircle,
} from 'react-icons/pi';

export default function SyncDetailsPage() {
  const router = useRouter();
  const { refetch } = useGetCurrentMemberQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const [syncMember, { isLoading: isSyncing, isSuccess: syncSuccess, isError: syncError }] = useSyncCurrentMemberMutation();
  
  // Get lastSynced from Redux state
  const lastSynced = useSelector((state: RootState) => state.members?.lastSynced);
  
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);

  const handleBack = () => {
    router.push('/profile');
  };

  const handleSync = async () => {
    try {
      setLastSyncAttempt(new Date());
      await syncMember({ force: true }).unwrap();
      // Refetch member data after successful sync
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Failed to sync member:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PageHeader
        title="همگام‌سازی"
        titleIcon={<PiArrowClockwise className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4">
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">همگام‌سازی اطلاعات عضو</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-6">
              با استفاده از این قابلیت می‌توانید اطلاعات عضو خود را با سیستم اصلی همگام‌سازی کنید. این عملیات اطلاعات شما را از منبع اصلی به‌روزرسانی می‌کند.
            </p>
          </div>

          {/* Last Sync Info */}
          {lastSynced && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <PiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">آخرین همگام‌سازی</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(lastSynced).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSync}
              loading={isSyncing}
              loadingText="در حال همگام‌سازی..."
              block
              variant="primary"
              size="md"
              leftIcon={!isSyncing && <PiArrowClockwise className="h-5 w-5" />}
            >
              {isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی اطلاعات عضو'}
            </Button>
          </div>

          {/* Sync Status Messages */}
          {syncSuccess && lastSyncAttempt && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    همگام‌سازی با موفقیت انجام شد
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    در تاریخ {lastSyncAttempt.toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {syncError && lastSyncAttempt && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <PiXCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    خطا در همگام‌سازی
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    لطفاً دوباره تلاش کنید
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-xs text-blue-700 dark:text-blue-300 leading-6">
              <strong>نکته:</strong> همگام‌سازی ممکن است چند لحظه طول بکشد. لطفاً صبر کنید.
            </div>
          </div>
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </ScrollableArea>
    </div>
  );
}

