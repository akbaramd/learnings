'use client';

import { useRouter } from 'next/navigation';
import { useLogoutMutation } from '@/src/store/auth';
import { performLogout } from '@/src/lib/logout';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Button } from '@/src/components/ui/Button';
import {
  PiSignOut,
  PiWarning,
} from 'react-icons/pi';

export default function LogoutDetailsPage() {
  const router = useRouter();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleBack = () => {
    router.push('/profile');
  };

  const handleLogout = async () => {
    // Use the standard logout utility following NextAuth best practices
    // Pattern: Backend API → NextAuth signOut → Redirect
    await performLogout(
      async () => {
        // Step 1: Call backend logout API (clears server-side session, cookies, and Redux state)
        await logout({ refreshToken: undefined }).unwrap();
      },
      {
        returnUrl: window.location.pathname,
        showToast: true,
      }
    );
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <PageHeader
        title="خروج از حساب"
        titleIcon={<PiSignOut className="h-5 w-5 text-red-600 dark:text-red-400" />}
        showBackButton={true}
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4">
          {/* Warning Card */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <PiWarning className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  هشدار
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  با خروج از حساب کاربری، دسترسی شما به سیستم قطع می‌شود و برای استفاده مجدد باید دوباره وارد شوید.
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">اطلاعات خروج</h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
              <li>جلسه شما به طور کامل بسته می‌شود</li>
              <li>اطلاعات محلی شما حفظ می‌شود</li>
              <li>می‌توانید با همان اطلاعات قبلی دوباره وارد شوید</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleLogout}
              loading={isLoggingOut}
              loadingText="در حال خروج..."
              block
              variant="solid"
              color="accent"
              size="md"
              leftIcon={!isLoggingOut && <PiSignOut className="h-5 w-5" />}
            >
              {isLoggingOut ? 'در حال خروج...' : 'خروج از حساب'}
            </Button>

            <Button
              onClick={handleCancel}
              block
              variant="subtle"
              size="md"
              disabled={isLoggingOut}
            >
              انصراف
            </Button>
          </div>
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </ScrollableArea>
    </div>
  );
}

