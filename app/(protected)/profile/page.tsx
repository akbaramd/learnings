'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  PiUser,
  PiArrowClockwise,
  PiSpinner,
  PiSignOut,
  PiCaretLeft,
  PiUserCircle,
  PiDeviceMobile,
} from 'react-icons/pi';

function ProfileHeader() {
  const { user, userName } = useAuth();
  
  // Use USER information, not member information
  const displayName = userName || user?.firstName || 'کاربر';
  const nationalId = user?.nationalId || null;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-8">
        {/* Avatar Section - Instagram Style */}
        <div className="flex flex-col items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 ring-4 ring-white dark:ring-gray-800">
            <PiUser className="h-14 w-14 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {displayName}
          </h2>
          {nationalId && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {nationalId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ 
  icon, 
  label, 
  onClick, 
  loading = false,
  danger = false,
  showArrow = true 
}: { 
  icon: React.ReactNode; 
  label: string; 
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
        w-full flex items-center justify-between px-4 py-3.5
        text-right transition-all duration-200
        bg-white dark:bg-gray-800
        rounded-lg
        border border-gray-200 dark:border-gray-700
        ${danger 
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700' 
          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`flex-shrink-0 ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {loading ? <PiSpinner className="h-5 w-5 animate-spin" /> : icon}
        </div>
        <span className={`text-sm font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
          {label}
        </span>
      </div>
      {showArrow && !loading && (
        <PiCaretLeft className={`h-5 w-5 flex-shrink-0 ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
      )}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        {/* Profile Header - Instagram Style - Shows USER info */}
        <ProfileHeader />

        {/* Menu Items - Instagram/Telegram Style - Each item is separate */}
        <div className="px-4 mt-4 space-y-3">
          {/* Member Info - Separate Item */}
          <MenuItem
            icon={<PiUserCircle className="h-5 w-5" />}
            label="اطلاعات عضو"
            onClick={() => router.push('/profile/member-details')}
          />

          {/* Sessions - Separate Item */}
          <MenuItem
            icon={<PiDeviceMobile className="h-5 w-5" />}
            label="دستگاه‌ها و نشست‌ها"
            onClick={() => router.push('/profile/sessions')}
          />

          {/* Sync - Separate Item */}
          <MenuItem
            icon={<PiArrowClockwise className="h-5 w-5" />}
            label="همگام‌سازی"
            onClick={() => router.push('/profile/sync-details')}
          />

          {/* Logout - Separate Item */}
          <MenuItem
            icon={<PiSignOut className="h-5 w-5" />}
            label="خروج از حساب"
            onClick={() => router.push('/profile/logout-details')}
            danger={true}
          />
        </div>

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </ScrollableArea>
    </div>
  );
}
