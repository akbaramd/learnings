// src/store/notifications/notifications.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { NotificationState, NotificationFilters } from './notifications.types';

// Base selector for notification state
const selectNotificationState = (state: RootState): NotificationState => state.notifications;

// Basic selectors
export const selectNotifications = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.notifications
);

export const selectUnreadCount = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.unreadCount
);

export const selectUnreadCountByContext = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.unreadCountByContext
);

export const selectUnreadCountByAction = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.unreadCountByAction
);

export const selectPagination = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.pagination
);

export const selectIsLoading = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.isLoading
);

export const selectError = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.error
);

export const selectLastFetched = createSelector(
  [selectNotificationState],
  (notificationState) => notificationState.lastFetched
);

// Computed selectors
export const selectHasNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.length > 0
);

export const selectHasUnreadNotifications = createSelector(
  [selectUnreadCount],
  (unreadCount) => unreadCount > 0
);

export const selectReadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(notification => notification.isRead === true)
);

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(notification => notification.isRead === false)
);

export const selectExpiredNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(notification => notification.isExpired === true)
);

export const selectActiveNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(notification => notification.isExpired !== true)
);

// Filtered selectors
export const selectNotificationsByContext = createSelector(
  [selectNotifications, (state: RootState, context: string) => context],
  (notifications, context) => notifications.filter(notification => notification.context === context)
);

export const selectNotificationsByAction = createSelector(
  [selectNotifications, (state: RootState, action: string) => action],
  (notifications, action) => notifications.filter(notification => notification.action === action)
);

export const selectNotificationsByFilters = createSelector(
  [selectNotifications, (state: RootState, filters: NotificationFilters) => filters],
  (notifications, filters) => {
    return notifications.filter(notification => {
      if (filters.isRead !== undefined && notification.isRead !== filters.isRead) {
        return false;
      }
      if (filters.context && notification.context !== filters.context) {
        return false;
      }
      if (filters.action && notification.action !== filters.action) {
        return false;
      }
      return true;
    });
  }
);

// Pagination selectors
export const selectHasNextPage = createSelector(
  [selectPagination],
  (pagination) => pagination?.hasNextPage ?? false
);

export const selectHasPreviousPage = createSelector(
  [selectPagination],
  (pagination) => pagination?.hasPreviousPage ?? false
);

export const selectCurrentPage = createSelector(
  [selectPagination],
  (pagination) => pagination?.pageNumber ?? 1
);

export const selectPageSize = createSelector(
  [selectPagination],
  (pagination) => pagination?.pageSize ?? 10
);

export const selectTotalPages = createSelector(
  [selectPagination],
  (pagination) => pagination?.totalPages ?? 1
);

export const selectTotalCount = createSelector(
  [selectPagination],
  (pagination) => pagination?.totalCount ?? 0
);

// Context-specific unread counts
export const selectUnreadCountForContext = createSelector(
  [selectUnreadCountByContext, (state: RootState, context: string) => context],
  (contextBreakdown, context) => contextBreakdown[context] ?? 0
);

export const selectUnreadCountForAction = createSelector(
  [selectUnreadCountByAction, (state: RootState, action: string) => action],
  (actionBreakdown, action) => actionBreakdown[action] ?? 0
);

// Notification by ID selector
export const selectNotificationById = createSelector(
  [selectNotifications, (state: RootState, id: string) => id],
  (notifications, id) => notifications.find(notification => notification.id === id)
);

// Recent notifications (last 24 hours)
export const selectRecentNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return notifications.filter(notification => {
      if (!notification.createdAt) return false;
      const createdAt = new Date(notification.createdAt);
      return createdAt >= oneDayAgo;
    });
  }
);

// Notification statistics
export const selectNotificationStats = createSelector(
  [selectNotifications, selectUnreadCountByContext, selectUnreadCountByAction],
  (notifications, contextBreakdown, actionBreakdown) => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    read: notifications.filter(n => n.isRead).length,
    expired: notifications.filter(n => n.isExpired).length,
    byContext: contextBreakdown,
    byAction: actionBreakdown,
  })
);
