'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGetMeQuery } from '@/src/store/auth';
import { useAuth } from '@/src/hooks/useAuth';
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
      <IconButton aria-label="Loading theme" variant="ghost">
        <PiSun className="h-4 w-4" />
      </IconButton>
    );
  }

  // Only show light or dark icons (no system mode)
  const currentTheme = theme === 'system' ? 'light' : theme;
  const icon = currentTheme === 'light' ? <PiSun className="h-4 w-4" /> : <PiMoon className="h-4 w-4" />;
  const label = currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <IconButton aria-label={label} onClick={handleToggleTheme} variant="ghost">
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
  const pathnameRef = useRef(pathname);

  // Update pathname ref whenever it changes
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Use useAuth hook for authentication state
  const { isAuthenticated, isReady, authStatus } = useAuth();

  // Fetch user profile on mount - this will set isInitialized to true
  // Skip if not ready to prevent infinite loops
  useGetMeQuery(undefined, {
    skip: !isReady, // Only fetch when auth is ready
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Check authentication and redirect if not authenticated
  // Listen to both isAuthenticated AND authStatus to catch all state changes
  useEffect(() => {
    console.log('[ProtectedLayout] Auth state check:', { 
      isReady, 
      isAuthenticated, 
      authStatus,
      pathname: pathnameRef.current 
    });
    
    // Don't process anything until auth is ready
    if (!isReady) {
      console.log('[ProtectedLayout] Auth not ready yet, waiting...');
      return;
    }
    
    // If not authenticated OR status is anonymous, redirect to login
    if (!isAuthenticated || authStatus === 'anonymous') {
      console.log('[ProtectedLayout] User not authenticated or status is anonymous, redirecting to login...');
      console.log('[ProtectedLayout] Current pathname:', pathnameRef.current);
      const returnUrl = encodeURIComponent(pathnameRef.current || '/');
      console.log('[ProtectedLayout] Return URL:', returnUrl);
      console.log('[ProtectedLayout] Redirecting to:', `/login?logout=true&r=${returnUrl}`);
      window.location.href = `/login?logout=true&r=${returnUrl}`;
      return;
    }
    
    console.log('[ProtectedLayout] User authenticated, no redirect needed');
  }, [isAuthenticated, isReady, authStatus]);

  // Auto-fetch notifications when authenticated and ready
  const shouldPollNotifications = useMemo(() => isReady && isAuthenticated, [isReady, isAuthenticated]);
  
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

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="h-screen container mx-auto  sm:max-w-full md:max-w-[30rem] lg:max-w-[25rem] max-w-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col" dir="rtl">
      {/* Top App Bar - Fixed at top with elevation */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <IconButton 
            aria-label="Go to home"
            onClick={handleHomeClick}
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

      {/* Content - Flexible area with proper background contrast */}
      <main className="flex-1 overflow-hidden ">
        <div className="h-full w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        unreadCountData={unreadCountData || { result: { totalCount: 0 }, errors: null }} 
        notificationsLoading={notificationsLoading} 
      />
    </div>
  );
}
