'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { IconButton } from '@/src/components/ui/IconButton';
import { useTheme } from '@/src/hooks/useTheme';
import { BottomNavigation } from '@/src/components/navigation/BottomNavigation';
import { NotificationDot } from '@/src/components/ui/NotificationBadge';
import { GetUnreadCountResponse, useGetUnreadCountQuery } from '@/src/store/notifications';
import Drawer from '@/src/components/overlays/Drawer';
import {
  PiListDashesDuotone,
  PiBell,
  PiSun,
  PiMoon,
  PiComputerTowerDuotone,
  PiHouse,
  PiUser,
  PiSignOut,
  PiReceipt,
} from 'react-icons/pi';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

function ThemeIconButton() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the expected size
    return (
      <IconButton aria-label="Loading theme" variant="ghost">
        <PiComputerTowerDuotone className="h-4 w-4" />
      </IconButton>
    );
  }

  const icon =
    theme === 'light' ? <PiSun className="h-4 w-4" /> :
    theme === 'dark' ? <PiMoon className="h-4 w-4" /> :
    <PiComputerTowerDuotone className="h-4 w-4" />;

  const label =
    theme === 'light' ? 'Switch to dark mode' :
    theme === 'dark' ? 'Switch to system mode' :
    'Switch to light mode';

  return (
    <IconButton aria-label={label} onClick={toggleTheme} variant="ghost">
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

function MenuDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: <PiHouse className="h-5 w-5" />,
      path: '/dashboard',
      active: pathname === '/dashboard' || pathname === '/',
    },
    {
      id: 'bills',
      label: 'صورت حساب‌ها',
      icon: <PiReceipt className="h-5 w-5" />,
      path: '/bills',
      active: pathname.startsWith('/bills'),
    },
    {
      id: 'notifications',
      label: 'اعلان‌ها',
      icon: <PiBell className="h-5 w-5" />,
      path: '/notifications',
      active: pathname.startsWith('/notifications'),
    },
    {
      id: 'profile',
      label: 'پروفایل',
      icon: <PiUser className="h-5 w-5" />,
      path: '/profile',
      active: pathname.startsWith('/profile'),
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleLogout = () => {
    // Add logout logic here
    router.push('/login');
    onClose();
  };

  return (
    <Drawer open={isOpen} onClose={onClose} side="start" size="sm">
      <Drawer.Header>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          منو
        </h2>
      </Drawer.Header>
      
      <Drawer.Body>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right transition-colors ${
                item.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </Drawer.Body>
      
      <Drawer.Footer>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 transition-colors"
        >
          <PiSignOut className="h-5 w-5" />
          <span className="font-medium">خروج</span>
        </button>
      </Drawer.Footer>
    </Drawer>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // استفاده از custom hook برای authentication state
  const { 
    isAuthenticated, 
    isLoading,
    isSessionLoading,
    isReady,
    error,
    authStatus,
    initializeAuth
  } = useAuth();

  // Auto-fetch notifications when authenticated
  const { data: unreadCountData, isLoading: notificationsLoading } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isAuthenticated || !isReady, // Only fetch when authenticated and ready
      pollingInterval: 30000, // Poll every 30 seconds for real-time updates
      refetchOnMountOrArgChange: false, // Don't refetch on mount
      refetchOnFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  // Initialize auth when component mounts
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    // Only initialize if we haven't started yet
    if (authStatus === 'idle' || authStatus === 'loading') {
      initAuth();
    }
  }, [initializeAuth, authStatus]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isReady, router]);

  // Show loading spinner while checking authentication
  if (isLoading || isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600  mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            در حال بررسی احراز هویت...
          </p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && authStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">
            خطا در بررسی احراز هویت: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, will redirect to login
  if (!isAuthenticated && isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            در حال انتقال به صفحه ورود...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-900 dark:text-gray-100 flex flex-col" dir="rtl">
      {/* Top App Bar - Fixed at top */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-14 items-center justify-between px-4">
          <IconButton 
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <PiListDashesDuotone className="h-4 w-4 text-gray-700 dark:text-gray-200" />
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

      {/* Content - Flexible area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="flex-shrink-0">
        <BottomNavigation 
          unreadCountData={unreadCountData} 
          notificationsLoading={notificationsLoading} 
        />
      </div>

      {/* Menu Drawer */}
      <MenuDrawer 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </div>
  );
}
