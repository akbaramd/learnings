'use client';

import { useState, useEffect, useRef } from 'react';
import { useMarkAsReadMutation, useMarkAllAsReadMutation, Notification, useLazyGetUnreadCountQuery, useLazyGetNotificationsPaginatedQuery } from '@/src/store/notifications';
import {
  PiCheck,
  PiX,
  PiClock,
  PiInfo,
  PiCheckCircle,
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
      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
        notification.isRead 
          ? 'bg-gray-50 dark:bg-gray-800' 
          : 'bg-white dark:bg-gray-700'
      } border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getNotificationIcon(notification.context)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${
              notification.isRead 
                ? 'text-gray-600 dark:text-gray-300' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {notification.title || 'اعلان'}
            </h3>
            {!notification.isRead && (
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {notification.message || 'پیام اعلان'}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
            <PiClock className="h-3 w-3" />
            {notification.createdAt ? formatRelativeFa(notification.createdAt) : 'نامشخص'}
          </div>
          {notification.context && (
            <div className="mt-1">
              <span className="inline-block rounded-full bg-gray-200 dark:bg-gray-600 px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                {notification.context}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const pageSize = 10;
  const isFirstPageRef = useRef(true);
  
  // Lazy query hooks
  const [triggerGetUnreadCount, { data: unreadCountData, isLoading: unreadLoading }] = useLazyGetUnreadCountQuery();
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
    <div className="py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          همه اعلان‌ها
        </h2>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllLoading}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50"
            >
              {markAllLoading ? 'در حال پردازش...' : 'همه را خوانده شده علامت‌گذاری کن'}
            </button>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unreadLoading ? '...' : `${unreadCount} خوانده نشده`}
          </span>
        </div>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <PiInfo className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            هیچ اعلانی وجود ندارد
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
          
          {page < totalPages && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={notificationsLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {notificationsLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
              </button>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            نمایش {notifications.length} از {totalCount} اعلان
          </div>
        </>
      )}
    </div>
  );
}
