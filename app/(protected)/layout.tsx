'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';
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

function MenuDrawer({ isOpen, onClose, onLogout }: { isOpen: boolean; onClose: () => void; onLogout: () => Promise<void> }) {
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

  const handleLogout = async () => {
    await onLogout(); // This handles cross-tab sync + redirect
    onClose();
  };

  return (
    <Drawer open={isOpen} onClose={onClose} side="start" size="sm">
      <Drawer.Header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          منو
        </h2>
      </Drawer.Header>
      
      <Drawer.Body className="bg-gray-50 dark:bg-gray-950">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right transition-all ${
                item.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </Drawer.Body>
      
      <Drawer.Footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-right text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-all hover:shadow-sm"
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Auth is handled by AuthSyncProvider at root
  // Only use auth state for data fetching (not for guards/redirects)
  const { isAuthenticated, isReady } = useAuth();
  const { requestLogout } = useAuthGuard();

  // Auto-fetch notifications when authenticated and ready
  const { data: unreadCountData, isLoading: notificationsLoading } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !isReady || !isAuthenticated, // Only fetch when ready and authenticated
      pollingInterval: 30000, // Poll every 30 seconds for real-time updates
      refetchOnMountOrArgChange: false, // Don't refetch on mount
      refetchOnFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Only refetch on reconnect
    }
  );

  return (
    <div className="h-screen container mx-auto  sm:max-w-full md:max-w-[30rem] lg:max-w-[25rem] max-w-full bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col" dir="rtl">
      {/* Top App Bar - Fixed at top with elevation */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <IconButton 
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

      {/* Content - Flexible area with proper background contrast */}
      <main className="flex-1 overflow-hidden ">
        <div className="h-full w-full">
          {children}
        </div>
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
        onLogout={requestLogout}
      />
    </div>
  );
}
