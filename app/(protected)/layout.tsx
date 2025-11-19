'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { IconButton } from '@/src/components/ui/IconButton';
import { useTheme } from '@/src/hooks/useTheme';
import { NotificationDot } from '@/src/components/ui/NotificationBadge';
import { GetUnreadCountResponse, useGetUnreadCountQuery } from '@/src/store/notifications';
import { BottomNavigation } from '@/src/components/navigation/BottomNavigation';
import {
  PiBell,
  PiSun,
  PiMoon,
  PiHouse,
  PiSpinner,
} from 'react-icons/pi';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

function ThemeIconButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Ensure system mode is converted to light on mount
  useEffect(() => {
    if (mounted && theme === 'system') {
      setTheme('light');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, theme]); // Removed setTheme from deps - it's stable

  const handleToggleTheme = () => {
    // Only toggle between light and dark
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  if (!mounted) {
    // Return a placeholder that matches the expected size
    return (
      <IconButton aria-label="Loading theme" variant="solid" color="secondary">
        <PiSun className="h-4 w-4" />
      </IconButton>
    );
  }

  // Only show light or dark icons (no system mode)
  const currentTheme = theme === 'system' ? 'light' : theme;
  const icon = currentTheme === 'light' ? <PiSun className="h-4 w-4" /> : <PiMoon className="h-4 w-4" />;
  const label = currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <IconButton aria-label={label} onClick={handleToggleTheme} variant="subtle" color="secondary">
      {icon}
    </IconButton>
  );
}

function NotificationButton({ unreadCountData, notificationsLoading }: { 
  unreadCountData: GetUnreadCountResponse; 
  notificationsLoading: boolean; 
}) {
  const router = useRouter();
  
  const unreadCount = unreadCountData?.result?.totalCount || 0;
  const hasUnreadNotifications = unreadCount > 0;

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  return (
    <div className="relative">
      <IconButton   
        aria-label={`اعلان‌ها${hasUnreadNotifications ? ` (${unreadCount} اعلان خوانده نشده)` : ''}`}
        onClick={handleNotificationClick}
        variant="subtle"
        color="secondary"
      >
        <PiBell className="h-4 w-4 text-gray-700 dark:text-gray-200" />
      </IconButton>
      {hasUnreadNotifications && !notificationsLoading && (
        <NotificationDot />
      )}
    </div>
  );
}


function BrandTitle() {
  return (
    <div className="flex flex-col items-center leading-none">
      <h1 className="text-base font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
        سامانه خدمات رفاهی
      </h1>
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const redirectInitiatedRef = useRef(false);

  // Determine authentication state
  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading'; // Still checking session

  // Auto-fetch notifications when authenticated
  const shouldPollNotifications = useMemo(() => isAuthenticated, [isAuthenticated]);
  
  const { data: unreadCountData, isLoading: notificationsLoading } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !shouldPollNotifications,
      pollingInterval: shouldPollNotifications ? 30000 : 0,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: shouldPollNotifications,
    }
  );

  // Handle authentication guard and redirects
  useEffect(() => {
    // Don't redirect until session status is determined
    if (isLoading || redirectInitiatedRef.current) {
      return;
    }

    // If user is not authenticated, redirect to login
    if (!isAuthenticated) {
      redirectInitiatedRef.current = true;
      
      // Build login URL with return URL
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = `/login?r=${returnUrl}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProtectedLayout] User not authenticated, redirecting to login:', {
          pathname,
          status,
          hasSession: !!session,
        });
      }
      
      router.push(loginUrl);
    }
  }, [status, isLoading, isAuthenticated, pathname, router, session]);

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen mx-auto max-w-full sm:max-w-full md:max-w-[30rem] lg:max-w-[30rem] xl:max-w-[30rem] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <PiSpinner className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            در حال بررسی احراز هویت...
          </p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return (
      <div className="h-screen mx-auto max-w-full sm:max-w-full md:max-w-[30rem] lg:max-w-[30rem] xl:max-w-[30rem] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <PiSpinner className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            در حال انتقال به صفحه ورود...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated - render the protected layout
  return (
    <div className="h-screen mx-auto max-w-full sm:max-w-full md:max-w-[30rem] lg:max-w-[30rem] xl:max-w-[30rem] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden" dir="rtl">
      {/* Top App Bar - Fixed at top */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <div className="flex h-14 items-center justify-between px-4">
          <IconButton 
            aria-label="Go to home"
            onClick={handleHomeClick}
            variant="subtle"
            color="secondary"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <PiHouse className="h-4 w-4 text-gray-700 dark:text-gray-200" />
          </IconButton>
          <BrandTitle />
          <div className="flex items-center gap-2">
            <ThemeIconButton />
            <NotificationButton 
              unreadCountData={unreadCountData || { result: { totalCount: 0 }, errors: null }} 
              notificationsLoading={notificationsLoading} 
            />
          </div>
        </div>
      </header>

      {/* Content - Scrollable area between header and bottom nav */}
      <main className="flex-1 min-h-0 relative">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="flex-shrink-0 z-10">
        <BottomNavigation 
          unreadCountData={unreadCountData || { result: { totalCount: 0 }, errors: null }} 
          notificationsLoading={notificationsLoading} 
        />
      </div>
    </div>
  );
}
