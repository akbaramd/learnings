'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NotificationBadge } from '@/src/components/ui/NotificationBadge';
import { GetUnreadCountResponse } from '@/src/store/notifications';
import {
  PiHouse,
  PiHouseFill,
  PiBell,
  PiBellFill,
  PiUser,
  PiUserFill,
  PiReceipt,
  PiReceiptFill,
  PiHeadset,
  PiHeadsetFill,
} from 'react-icons/pi';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'خانه',
    path: '/dashboard',
    icon: <PiHouse className="h-5 w-5" />,
    activeIcon: <PiHouseFill className="h-5 w-5" />,
  },
  {
    id: 'bills',
    label: 'صورت حساب‌ها',
    path: '/bills',
    icon: <PiReceipt className="h-5 w-5" />,
    activeIcon: <PiReceiptFill className="h-5 w-5" />,
  },
  {
    id: 'notifications',
    label: 'اعلان‌ها',
    path: '/notifications',
    icon: <PiBell className="h-5 w-5" />,
    activeIcon: <PiBellFill className="h-5 w-5" />,
  },
  {
    id: 'support',
    label: 'پشتیبانی',
    path: '/support',
    icon: <PiHeadset className="h-5 w-5" />,
    activeIcon: <PiHeadsetFill className="h-5 w-5" />,
  },
  {
    id: 'profile',
    label: 'پروفایل',
    path: '/profile',
    icon: <PiUser className="h-5 w-5" />,
    activeIcon: <PiUserFill className="h-5 w-5" />,
  },
];

interface BottomNavigationProps {
  unreadCountData?: GetUnreadCountResponse;
  notificationsLoading?: boolean;
}

export function BottomNavigation({ unreadCountData, notificationsLoading = false }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  const unreadCount = unreadCountData?.result?.totalCount || 0;

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => {
    if (!mounted) {
      return path === '/dashboard'; // Default to home during SSR
    }
    
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(path);
  };


  if (!mounted) {
    // Return a placeholder that matches the expected structure
    return (
      <nav 
        className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        style={{
          // Add extra padding at bottom for mobile devices with gesture navigation bars
          // env(safe-area-inset-bottom) handles iOS home indicator and Android gesture bar
          // max() ensures minimum 8px padding for devices without safe area support
          // This prevents navigation from going under system UI indicators
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        }}
      >
        <div className="flex h-16 items-center justify-around px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors text-gray-600 dark:text-gray-400"
            >
              <div className="text-gray-600 dark:text-gray-400">
                {item.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav 
      className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      style={{
        // Add extra padding at bottom for mobile devices with gesture navigation bars
        // env(safe-area-inset-bottom) handles iOS home indicator and Android gesture bar
        // max() ensures minimum 8px padding for devices without safe area support
        // This prevents navigation from going under system UI indicators
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
      }}
    >
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const showNotificationBadge = item.id === 'notifications' && unreadCount > 0 && !notificationsLoading;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <div className={`relative transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                {active ? item.activeIcon : item.icon}
                {showNotificationBadge && (
                  <NotificationBadge count={unreadCount} />
                )}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
