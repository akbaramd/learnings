'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Button } from '@/src/components/ui/Button';
import { useMarkAsReadMutation, useMarkAllAsReadMutation, Notification, useLazyGetUnreadCountQuery, useLazyGetNotificationsPaginatedQuery } from '@/src/store/notifications';
import {
  PiBell,
  PiCheck,
  PiX,
  PiClock,
  PiInfo,
  PiCheckCircle,
  PiArrowClockwise,
  PiCheckCircle as PiCheckCircle2,
} from 'react-icons/pi';

function formatRelativeFa(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'هم‌اکنون';
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

function getNotificationIcon(context?: string | null) {
  switch (context) {
    case 'payment':
      return <PiCheck className="h-4 w-4 text-green-600" />;
    case 'security':
      return <PiX className="h-4 w-4 text-red-600" />;
    case 'promotion':
      return <PiInfo className="h-4 w-4 text-yellow-600" />;
    case 'booking':
      return <PiCheckCircle className="h-4 w-4 text-blue-600" />;
    default:
      return <PiInfo className="h-4 w-4 text-blue-600" />;
  }
}

function getContextLabel(context?: string | null): string {
  // Convert context to lowercase for case-insensitive matching
  const normalizedContext = (context || '').toLowerCase().trim();
  
  const labels: Record<string, string> = {
    'payment': 'پرداخت',
    'billpayment': 'پرداخت صورت حساب',
    'bill_payment': 'پرداخت صورت حساب',
    'bill-payment': 'پرداخت صورت حساب',
    'security': 'امنیت',
    'promotion': 'تخفیف',
    'booking': 'رزرو',
    'system': 'سیستم',
    'account': 'حساب کاربری',
    'bill': 'صورت حساب',
    'invoice': 'صورت حساب',
    'order': 'سفارش',
    'transaction': 'تراکنش',
    'notification': 'اعلان',
    'announcement': 'اعلامیه',
  };
  
  // Check exact match first
  if (labels[normalizedContext]) {
    return labels[normalizedContext];
  }
  
  // Check if contains keywords
  if (normalizedContext.includes('bill') && normalizedContext.includes('payment')) {
    return 'پرداخت صورت حساب';
  }
  if (normalizedContext.includes('bill')) {
    return 'صورت حساب';
  }
  if (normalizedContext.includes('payment')) {
    return 'پرداخت';
  }
  
  // Return original if no match, but try to make it more readable
  return normalizedContext || 'عمومی';
}

function NotificationItem({ notification }: { notification: Notification }) {
  const [markAsRead] = useMarkAsReadMutation();

  const handleMarkAsRead = async () => {
    if (notification.id && !notification.isRead) {
      try {
        await markAsRead(notification.id).unwrap();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  return (
    <div 
      className={`rounded-lg border p-4 cursor-pointer transition-all duration-300 ${
        notification.isRead 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm ring-2 ring-blue-200 dark:ring-blue-900/30'
      } hover:shadow-md hover:scale-[1.01]`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 p-2 rounded-full ${
          notification.isRead 
            ? 'bg-gray-100 dark:bg-gray-700' 
            : 'bg-blue-50 dark:bg-blue-900/20'
        }`}>
          {getNotificationIcon(notification.context)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${
              notification.isRead 
                ? 'text-gray-600 dark:text-gray-300' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {notification.title || 'اعلان'}
            </h3>
            {!notification.isRead && (
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            )}
          </div>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {notification.message || 'پیام اعلان'}
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <PiClock className="h-3.5 w-3.5" />
            <span>{notification.createdAt ? formatRelativeFa(notification.createdAt) : 'نامشخص'}</span>
          </div>
          {notification.context && (
            <div className="mt-2">
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                notification.context === 'payment' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : notification.context === 'security'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : notification.context === 'promotion'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {getContextLabel(notification.context)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const pageSize = 10;
  const isFirstPageRef = useRef(true);
  
  // Lazy query hooks
  const [triggerGetUnreadCount, { data: unreadCountData }] = useLazyGetUnreadCountQuery();
  const [triggerGetNotificationsPaginated, { 
    data: notificationsData, 
    isLoading: notificationsLoading, 
    error: notificationsError 
  }] = useLazyGetNotificationsPaginatedQuery();
  
  const [markAllAsRead, { isLoading: markAllLoading }] = useMarkAllAsReadMutation();

  // Load initial data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load unread count
        await triggerGetUnreadCount();
        
        // Load first page of notifications
        await triggerGetNotificationsPaginated({
          pageNumber: 1,
          pageSize: pageSize,
        });
      } catch (error) {
        console.error('Failed to load initial notification data:', error);
      }
    };

    loadInitialData();
  }, [triggerGetUnreadCount, triggerGetNotificationsPaginated, pageSize]);

  // Update notifications when new data arrives
  useEffect(() => {
    if (notificationsData?.result?.items) {
      const newItems = notificationsData.result.items;
      
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        if (isFirstPageRef.current) {
          // First page - replace all notifications
          setAllNotifications(newItems);
          isFirstPageRef.current = false;
        } else {
          // Subsequent pages - append to existing notifications
          setAllNotifications(prev => [...prev, ...newItems]);
        }
      }, 0);
    }
  }, [notificationsData]);

  // Get current data from API responses
  const notifications = allNotifications;
  const totalCount = notificationsData?.result?.totalCount || 0;
  const totalPages = notificationsData?.result?.totalPages || 1;
  const unreadCount = unreadCountData?.result?.totalCount || 0;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      // Reset first page flag
      isFirstPageRef.current = true;
      // Refresh both unread count and notifications
      await Promise.all([
        triggerGetUnreadCount(),
        triggerGetNotificationsPaginated({
          pageNumber: 1,
          pageSize: pageSize,
        })
      ]);
      // Reset to first page
      setPage(1);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleLoadMore = async () => {
    if (page < totalPages && !notificationsLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      
      try {
        await triggerGetNotificationsPaginated({
          pageNumber: nextPage,
          pageSize: pageSize,
        });
      } catch (error) {
        console.error('Failed to load more notifications:', error);
        // Revert page on error
        setPage(page);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      // Reset first page flag
      isFirstPageRef.current = true;
      await Promise.all([
        triggerGetUnreadCount(),
        triggerGetNotificationsPaginated({
          pageNumber: 1,
          pageSize: pageSize,
        })
      ]);
      setPage(1);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  if (notificationsLoading && page === 1) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="py-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            خطا در بارگذاری اعلان‌ها
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="اعلان‌ها"
        titleIcon={<PiBell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        subtitle={unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : undefined}
        showBackButton
        onBack={() => {
          // Check if came from dashboard
          if (document.referrer && document.referrer.includes('/dashboard')) {
            router.back();
          } else {
            router.push('/dashboard');
          }
        }}
        rightActions={[
          {
            icon: <PiArrowClockwise className="h-4 w-4" />,
            onClick: handleRefresh,
            label: 'تازه‌سازی',
            'aria-label': 'تازه‌سازی',
          },
          ...(unreadCount > 0 ? [{
            icon: <PiCheckCircle2 className="h-4 w-4" />,
            onClick: handleMarkAllAsRead,
            label: 'علامت همه به عنوان خوانده شده',
            'aria-label': 'علامت همه به عنوان خوانده شده',
            disabled: markAllLoading,
          }] : []),
        ]}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <PiInfo className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                هیچ اعلانی وجود ندارد
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                زمانی که اعلان جدیدی دریافت کنید، اینجا نمایش داده می‌شود
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
              
              {/* Load More Button */}
              {page < totalPages && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={notificationsLoading}
                    block
                    loading={notificationsLoading}
                    loadingText="در حال بارگذاری..."
                  >
                    بارگذاری بیشتر
                  </Button>
                </div>
              )}
              
              {/* Results Counter */}
              {totalCount > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  نمایش {notifications.length} از {totalCount} اعلان
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
