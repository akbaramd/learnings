'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Button } from '@/src/components/ui/Button';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
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
  PiSparkle,
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

function NotificationItem({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasMarkedAsReadRef = useRef(false);

  // Auto-mark as read when item comes into view
  useEffect(() => {
    if (notification.isRead || hasMarkedAsReadRef.current || !notification.id) {
      return;
    }

    const currentElement = itemRef.current;
    if (!currentElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasMarkedAsReadRef.current) {
            hasMarkedAsReadRef.current = true;
            onMarkAsRead(notification.id!);
          }
        });
      },
      { threshold: 0.5 } // Mark as read when 50% visible
    );

    observer.observe(currentElement);

    return () => {
      observer.unobserve(currentElement);
    };
  }, [notification.id, notification.isRead, onMarkAsRead]);

  return (
    <Card
      ref={itemRef}
      variant="default"
      radius="lg"
      padding="md"
      className={`
        transition-all duration-300 ease-in-out
        ${notification.isRead 
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-80' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md ring-2 ring-emerald-200 dark:ring-emerald-900/30'
        }
        hover:shadow-lg hover:scale-[1.01]
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 mt-0.5 p-2.5 rounded-xl transition-all duration-300
          ${notification.isRead 
            ? 'bg-gray-100 dark:bg-gray-700' 
            : 'bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20'
          }
        `}>
          {getNotificationIcon(notification.context)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className={`
              text-sm font-semibold leading-tight
              ${notification.isRead 
                ? 'text-gray-600 dark:text-gray-300' 
                : 'text-gray-900 dark:text-gray-100'
              }
            `}>
              {notification.title || 'اعلان'}
            </h3>
            {!notification.isRead && (
              <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            {notification.message || 'پیام اعلان'}
          </p>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <PiClock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{notification.createdAt ? formatRelativeFa(notification.createdAt) : 'نامشخص'}</span>
            </div>
            {notification.context && (
              <span className={`
                inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
                ${notification.context === 'payment' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : notification.context === 'security'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                  : notification.context === 'promotion'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                }
              `}>
                {getContextLabel(notification.context)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [markedAsReadIds, setMarkedAsReadIds] = useState<Set<string>>(new Set());
  const pageSize = 10;
  const isInitialLoadRef = useRef(true);
  const loadedPageNumbersRef = useRef<Set<number>>(new Set());
  
  // Lazy query hooks
  const [triggerGetUnreadCount, { data: unreadCountData }] = useLazyGetUnreadCountQuery();
  const [triggerGetNotificationsPaginated, { 
    data: notificationsData, 
    isLoading: notificationsLoading, 
    error: notificationsError 
  }] = useLazyGetNotificationsPaginatedQuery();
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: markAllLoading }] = useMarkAllAsReadMutation();

  // Load initial data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        isInitialLoadRef.current = true;
        loadedPageNumbersRef.current.clear();
        
        // Load unread count
        await triggerGetUnreadCount();
        
        // Load first page of notifications
        await triggerGetNotificationsPaginated({
          pageNumber: 1,
          pageSize: pageSize,
        });
      } catch (error) {
        console.error('Failed to load initial notification data:', error);
      } finally {
        isInitialLoadRef.current = false;
      }
    };

    loadInitialData();
  }, [triggerGetUnreadCount, triggerGetNotificationsPaginated, pageSize]);

  // Update notifications when new data arrives - with proper deduplication
  useEffect(() => {
    if (!notificationsData?.result?.items) return;

    const newItems = notificationsData.result.items;
    const currentPage = notificationsData.result.pageNumber || 1;

    setAllNotifications(prev => {
      // Create a map of existing notifications by ID for quick lookup
      const existingMap = new Map(prev.map(n => [n.id, n]));
      
      // If this is the first page or a refresh, replace all
      if (isInitialLoadRef.current || currentPage === 1) {
        return newItems;
      }
      
      // For subsequent pages, merge without duplicates
      const merged = [...prev];
      newItems.forEach(newItem => {
        if (newItem.id && !existingMap.has(newItem.id)) {
          merged.push(newItem);
        } else if (newItem.id && existingMap.has(newItem.id)) {
          // Update existing notification if it changed
          const index = merged.findIndex(n => n.id === newItem.id);
          if (index !== -1) {
            merged[index] = newItem;
          }
        }
      });
      
      return merged;
    });

    // Track loaded pages
    if (!loadedPageNumbersRef.current.has(currentPage)) {
      loadedPageNumbersRef.current.add(currentPage);
    }
  }, [notificationsData]);

  // Handle mark as read - update in place
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (markedAsReadIds.has(notificationId)) {
      return; // Already marked or in progress
    }

    setMarkedAsReadIds(prev => new Set(prev).add(notificationId));

    // Optimistically update UI
    setAllNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );

    try {
      await markAsRead(notificationId).unwrap();
      // Refresh unread count
      await triggerGetUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update on error
      setAllNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: false } : n
        )
      );
      setMarkedAsReadIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }, [markAsRead, triggerGetUnreadCount, markedAsReadIds]);

  // Get current data from API responses
  const notifications = useMemo(() => {
    // Sort by created date (newest first) and ensure no duplicates
    const uniqueMap = new Map<string, Notification>();
    allNotifications.forEach(n => {
      if (n.id && !uniqueMap.has(n.id)) {
        uniqueMap.set(n.id, n);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [allNotifications]);

  const totalCount = notificationsData?.result?.totalCount || 0;
  const totalPages = notificationsData?.result?.totalPages || 1;
  const unreadCount = unreadCountData?.result?.totalCount || 0;

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead().unwrap();
      
      // Optimistically update all notifications
      setAllNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      // Reset state
      isInitialLoadRef.current = true;
      loadedPageNumbersRef.current.clear();
      setMarkedAsReadIds(new Set());
      
      // Refresh both unread count and notifications
      await Promise.all([
        triggerGetUnreadCount(),
        triggerGetNotificationsPaginated({
          pageNumber: 1,
          pageSize: pageSize,
        })
      ]);
      
      setPage(1);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsRead, triggerGetUnreadCount, triggerGetNotificationsPaginated, pageSize]);

  const handleLoadMore = useCallback(async () => {
    if (page >= totalPages || notificationsLoading) return;
    
    const nextPage = page + 1;
    
    // Prevent loading the same page twice
    if (loadedPageNumbersRef.current.has(nextPage)) {
      return;
    }
    
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
  }, [page, totalPages, notificationsLoading, triggerGetNotificationsPaginated, pageSize]);

  const handleRefresh = useCallback(async () => {
    try {
      // Reset state
      isInitialLoadRef.current = true;
      loadedPageNumbersRef.current.clear();
      setMarkedAsReadIds(new Set());
      
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
  }, [triggerGetUnreadCount, triggerGetNotificationsPaginated, pageSize]);

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
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-2">
          {notificationsLoading && page === 1 ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-4">
                <PiSparkle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                هیچ اعلانی وجود ندارد
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                زمانی که اعلان جدیدی دریافت کنید، اینجا نمایش داده می‌شود
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
              
              {/* Load More Button */}
              {page < totalPages && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  نمایش {notifications.length} از {totalCount} اعلان
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}
