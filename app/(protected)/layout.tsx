'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/src/store/auth/auth.selectors';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { IconButton } from '@/src/components/ui/IconButton';
import { useTheme } from '@/src/hooks/useTheme';
import { NotificationDot } from '@/src/components/ui/NotificationBadge';
import { GetUnreadCountResponse, useGetUnreadCountQuery } from '@/src/store/notifications';
import { BottomNavigation } from '@/src/components/navigation/BottomNavigation';
import { useGetCurrentMemberQuery } from '@/src/store/members';
import { companyInfo } from '@/src/components/AppBranding';
import {
  PiBell,
  PiSun,
  PiMoon,
  PiHouse,
  PiHeadset,
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
        سیستم جامع رفاهی
      </h1>
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-fetch member details when authenticated
  useGetCurrentMemberQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  // CRITICAL: Set viewport height dynamically to handle mobile browser UI
  // This ensures correct height calculation on page refresh
  useEffect(() => {
    const setViewportHeight = () => {
      // Handle desktop container
      if (desktopContainerRef.current) {
        const vh = window.innerHeight;
        desktopContainerRef.current.style.height = `${vh}px`;
        desktopContainerRef.current.style.maxHeight = `${vh}px`;
      }

      // Handle mobile container
      if (mobileContainerRef.current) {
        const vh = window.innerHeight;
        mobileContainerRef.current.style.height = `${vh}px`;
        mobileContainerRef.current.style.maxHeight = `${vh}px`;
      }
    };

    // Set height immediately
    setViewportHeight();

    // Update on resize (handles browser UI changes)
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Also update after a short delay to catch late browser UI adjustments
    const timeoutId = setTimeout(setViewportHeight, 100);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      clearTimeout(timeoutId);
    };
  }, []);

  // ProtectedRoute handles authentication check and redirect
  // It shows loading state during check and redirects if needed
  return (
    <ProtectedRoute>
      <div
        ref={mobileContainerRef}
        className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden"
              dir="rtl"
              style={{
                height: '100dvh',
                maxHeight: '100dvh',
              }}
            >
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
              <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="protected-content-scroll">
                  {children}
                </div>
              </main>

              {/* Bottom Navigation - Fixed at bottom */}
              <div className="flex-shrink-0 z-10">
                <BottomNavigation
                  unreadCountData={unreadCountData || { result: { totalCount: 0 }, errors: null }}
                  notificationsLoading={notificationsLoading}
                />
      </div>

      {/* Support Button - floating button for easy access */}
      <div className="fixed bottom-20 left-4 z-50 md:bottom-6">
        <button
          onClick={() => window.open('https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2', '_blank', 'noopener,noreferrer')}
          className="group flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          aria-label="پشتیبانی آنلاین"
          title="پشتیبانی آنلاین - کلیک کنید"
        >
          <PiHeadset className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap hidden lg:inline">
            پشتیبانی آنلاین
          </span>
          <span className="text-sm font-medium whitespace-nowrap lg:hidden md:inline">
            پشتیبانی
          </span>
        </button>

        {/* Tooltip for better UX */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          نیاز به کمک دارید؟ کلیک کنید
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
