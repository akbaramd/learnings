'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useGetMeQuery } from '@/src/store/auth';
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
  }, [mounted, theme, setTheme]);

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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  
  const getTitle = () => {
    if (!mounted) {
      return 'سیستم رفاهی مهندسین'; // Default title during SSR
    }
    
    if (pathname === '/dashboard' || pathname === '/') {
      return 'سیستم رفاهی مهندسین';
    }
    if (pathname.startsWith('/bills')) {
      return 'صورت حساب‌ها';
    }
    if (pathname.startsWith('/notifications')) {
      return 'اعلان‌ها';
    }
    if (pathname.startsWith('/profile')) {
      return 'پروفایل';
    }
    return 'سیستم رفاهی مهندسین';
  };

  return (
    <div className="flex flex-col items-center leading-none">
      <h1 className="text-base font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
        {getTitle()}
      </h1>
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);
  const checkingRef = useRef(false);
  const pathnameRef = useRef(pathname);

  // Update pathname ref whenever it changes (for use in redirect)
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Get auth state from Redux store
  const { isAuthenticated, isReady } = useAuth();

  // Fetch user profile on mount (only for protected routes)
  // Only fetch when auth is ready - prevents unnecessary requests
  // Server-side refresh token handling ensures tokens are valid before this runs
  // This query updates auth state via onQueryStarted in auth.queries.ts
  useGetMeQuery(undefined, {
    skip: !isReady, // Don't fetch until auth state is initialized
    refetchOnMountOrArgChange: false, // Don't refetch on mount
    refetchOnFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't auto-refetch on reconnect
  });

  // Redirect to login if not authenticated
  // Only check when auth state changes, not on pathname changes
  
  useEffect(() => {
    // Skip if already redirected or currently checking
    if (redirectedRef.current || checkingRef.current) return;
    
    // Wait for auth state to be ready
    if (!isReady) return;

    // If authenticated, allow rendering and reset redirect flag
    if (isAuthenticated) {
      redirectedRef.current = false;
      return;
    }

    // Not authenticated - redirect once
    // This happens when:
    // 1. User has no valid tokens (no cookies)
    // 2. Server-side refresh failed (401 after refresh attempt)
    checkingRef.current = true;
    redirectedRef.current = true;
    const returnUrl = encodeURIComponent(pathnameRef.current || '/');
    router.replace(`/login?r=${returnUrl}`);
    
    // Reset checking flag after navigation
    const timeoutId = setTimeout(() => {
      checkingRef.current = false;
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isReady, isAuthenticated, router]); // Only depend on auth state, not pathname

  // Auto-fetch notifications when authenticated and ready
  // Stop polling immediately when authentication fails
  const { data: unreadCountData, isLoading: notificationsLoading } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isReady || !isAuthenticated, // Only fetch when ready and authenticated
      pollingInterval: isReady && isAuthenticated ? 30000 : 0, // Stop polling when not authenticated
      refetchOnMountOrArgChange: false, // Don't refetch on mount
      refetchOnFocus: false, // Don't refetch on window focus
      refetchOnReconnect: isReady && isAuthenticated, // Only refetch on reconnect when authenticated
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
