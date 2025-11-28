'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppSelector } from '@/src/hooks/store';
import { selectUser, selectUserName, useGetMeQuery } from '@/src/store/auth';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { useState } from 'react';
import {
  PiUser,
  PiArrowClockwise,
  PiSpinner,
  PiSignOut,
  PiCaretLeft,
  PiUserCircle,
  PiDeviceMobile,
  PiHeadset,
  PiBookOpen,
  PiCrown,
  PiIdentificationCard,
  PiEnvelope,
  PiPhone,
  PiX,
} from 'react-icons/pi';

function ProfileHeader() {
  const { data: session } = useSession();
  const user = useAppSelector(selectUser);
  const userName = useAppSelector(selectUserName);
  const { data: member } = useGetMeQuery();
  
  const displayName = userName || user?.firstName || session?.user?.name || 'کاربر';
  const nationalId = user?.nationalId || null;
  const email = session?.user?.email || null;
  const phoneNumber = user?.phone || member?.data?.phone || null;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-6">
        <div className="flex flex-col items-center">
          {/* Avatar and Name Row */}
          <div className="flex items-center gap-4 mb-5 w-full max-w-md">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 shadow-lg">
                <PiUser className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
              </div>
          </div>

            {/* Name and Status */}
            <div className="flex-1 text-right">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-0.5">
            {displayName}
              </h1>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                آنلاین
              </div>
            </div>
          </div>

          {/* Info Items Grid */}
          <div className="grid grid-cols-1 gap-2 w-full max-w-md">
          {nationalId && (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex-shrink-0 w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                  <PiIdentificationCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">کد ملی</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{nationalId}</div>
                </div>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex-shrink-0 w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center">
                  <PiEnvelope className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">ایمیل</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" dir="ltr">{email}</div>
                </div>
              </div>
          )}

            {phoneNumber && (
              <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex-shrink-0 w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                  <PiPhone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">شماره تماس</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100" dir="ltr">{phoneNumber}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ 
  icon, 
  label, 
  description,
  onClick, 
  loading = false,
  danger = false,
  showArrow = true 
}: { 
  icon: React.ReactNode; 
  label: string; 
  description?: string;
  onClick: () => void;
  loading?: boolean;
  danger?: boolean;
  showArrow?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        group w-full p-4 transition-all duration-200 ease-out
        bg-white dark:bg-gray-800/50 backdrop-blur-sm
        rounded-2xl border border-gray-200/50 dark:border-gray-700/50
        hover:shadow-lg hover:shadow-gray-900/10 dark:hover:shadow-gray-900/20
        hover:border-gray-300 dark:hover:border-gray-600
        hover:scale-[1.005] active:scale-[0.995]
        ${danger 
          ? 'hover:bg-red-50/50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800'
          : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        relative overflow-hidden
      `}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          transition-all duration-200 group-hover:scale-105
          ${danger
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
          }
          ${loading ? 'animate-pulse' : ''}
        `}>
          {loading ? <PiSpinner className="h-5 w-5 animate-spin" /> : icon}
        </div>

        {/* Content - Right aligned */}
        <div className="flex-1 min-w-0 text-right">
          <div className={`text-base font-semibold transition-colors ${
            danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
          }`}>
          {label}
          </div>
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              {description}
            </div>
          )}
      </div>

        {/* Arrow */}
      {showArrow && !loading && (
          <PiCaretLeft className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
            danger ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
          }`} />
      )}
      </div>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Fetch user profile when authenticated
  useGetMeQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
    refetchOnMountOrArgChange: true, // Refetch when component mounts to ensure fresh data
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        {/* Profile Header - Modern Enterprise Style */}
        <ProfileHeader />

        {/* Menu Items - Functional Style */}
        <div className="px-6 py-6 space-y-3">
          {/* Account Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2">
              حساب کاربری
            </h3>

          <MenuItem
              icon={<PiUserCircle className="h-6 w-6" />}
            label="اطلاعات عضو"
              description="مشاهده و ویرایش اطلاعات عضویت"
            onClick={() => router.push('/profile/member-details')}
          />

          <MenuItem
              icon={<PiDeviceMobile className="h-6 w-6" />}
            label="دستگاه‌ها و نشست‌ها"
              description="مدیریت دستگاه‌های متصل و نشست‌ها"
            onClick={() => router.push('/profile/sessions')}
          />

          <MenuItem
              icon={<PiArrowClockwise className="h-6 w-6" />}
            label="همگام‌سازی"
              description="همگام‌سازی داده‌ها و تنظیمات"
            onClick={() => router.push('/profile/sync-details')}
          />
          </div>

          {/* Support Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2">
              پشتیبانی و آموزش
            </h3>

            <MenuItem
              icon={<PiHeadset className="h-6 w-6" />}
              label="پشتیبانی"
              description="تماس با تیم پشتیبانی"
              onClick={() => setShowSupportModal(true)}
            />

            <MenuItem
              icon={<PiBookOpen className="h-6 w-6" />}
              label="آموزش"
              description="آموزش‌های کاربردی و راهنماها"
              onClick={() => router.push('/tutorials')}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2">
            <MenuItem
              icon={<PiUser className="h-6 w-6" />}
              label="بازگشت به داشبورد"
              description="بازگشت به صفحه اصلی سیستم"
              onClick={() => router.push('/dashboard')}
            />
          </div>

          {/* Account Actions */}
          <div className="space-y-3 pt-4">
          <MenuItem
              icon={<PiSignOut className="h-6 w-6" />}
            label="خروج از حساب"
              description="خروج ایمن از حساب کاربری"
            onClick={() => router.push('/profile/logout-details')}
            danger={true}
          />
          </div>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-24" />
      </ScrollableArea>

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}

// Support Modal Component
function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const handleIframeLoad = () => {
    // Handle iframe load event if needed
    console.log('Support iframe loaded');
  };

  const handleIframeError = () => {
    // Handle iframe error if needed
    console.log('Support iframe error');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            پشتیبانی آنلاین
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <PiX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 h-full">
          <iframe
            src="https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2"
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="پشتیبانی آنلاین"
            allow="microphone; camera; geolocation"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            در صورت مشکل در بارگذاری، لطفاً با تیم پشتیبانی تماس بگیرید
          </p>
        </div>
      </div>
    </div>
  );
}
