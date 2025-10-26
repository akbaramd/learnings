// src/hooks/useLazyNotifications.ts
'use client';

import { 
  useLazyGetAllNotificationsQuery,
  useLazyGetNotificationsPaginatedQuery,
  useLazyGetUnreadCountQuery,
  useLazyGetUnreadCountByContextQuery,
  useLazyGetUnreadCountByActionQuery,
  GetAllNotificationsRequest,
  GetNotificationsPaginatedRequest,
} from '@/src/store/notifications';

/**
 * Comprehensive lazy notifications hook that provides manual control over all notification queries
 * Useful for scenarios where you want to trigger queries based on user actions or specific conditions
 */
export function useLazyNotifications() {
  // Lazy query hooks
  const [triggerGetAllNotifications, getAllNotificationsResult] = useLazyGetAllNotificationsQuery();
  const [triggerGetNotificationsPaginated, getNotificationsPaginatedResult] = useLazyGetNotificationsPaginatedQuery();
  const [triggerGetUnreadCount, getUnreadCountResult] = useLazyGetUnreadCountQuery();
  const [triggerGetUnreadCountByContext, getUnreadCountByContextResult] = useLazyGetUnreadCountByContextQuery();
  const [triggerGetUnreadCountByAction, getUnreadCountByActionResult] = useLazyGetUnreadCountByActionQuery();

  // Helper functions to trigger queries
  const fetchAllNotifications = (filters?: GetAllNotificationsRequest) => {
    return triggerGetAllNotifications(filters || {});
  };

  const fetchNotificationsPaginated = (request: GetNotificationsPaginatedRequest) => {
    return triggerGetNotificationsPaginated(request);
  };

  const fetchUnreadCount = () => {
    return triggerGetUnreadCount();
  };

  const fetchUnreadCountByContext = () => {
    return triggerGetUnreadCountByContext();
  };

  const fetchUnreadCountByAction = () => {
    return triggerGetUnreadCountByAction();
  };

  // Batch operations
  const refreshAllData = async () => {
    const promises = [
      fetchUnreadCount(),
      fetchUnreadCountByContext(),
      fetchUnreadCountByAction(),
    ];
    
    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh notification data:', error);
      return { success: false, error };
    }
  };

  const fetchNotificationData = async (request: GetNotificationsPaginatedRequest) => {
    const promises = [
      fetchNotificationsPaginated(request),
      fetchUnreadCount(),
    ];
    
    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch notification data:', error);
      return { success: false, error };
    }
  };

  return {
    // Query triggers
    fetchAllNotifications,
    fetchNotificationsPaginated,
    fetchUnreadCount,
    fetchUnreadCountByContext,
    fetchUnreadCountByAction,
    
    // Batch operations
    refreshAllData,
    fetchNotificationData,
    
    // Query results
    getAllNotifications: getAllNotificationsResult,
    getNotificationsPaginated: getNotificationsPaginatedResult,
    getUnreadCount: getUnreadCountResult,
    getUnreadCountByContext: getUnreadCountByContextResult,
    getUnreadCountByAction: getUnreadCountByActionResult,
    
    // Combined loading state
    isLoading: 
      getAllNotificationsResult.isLoading ||
      getNotificationsPaginatedResult.isLoading ||
      getUnreadCountResult.isLoading ||
      getUnreadCountByContextResult.isLoading ||
      getUnreadCountByActionResult.isLoading,
    
    // Combined error state
    hasError: 
      getAllNotificationsResult.isError ||
      getNotificationsPaginatedResult.isError ||
      getUnreadCountResult.isError ||
      getUnreadCountByContextResult.isError ||
      getUnreadCountByActionResult.isError,
    
    // Combined success state
    isSuccess: 
      getAllNotificationsResult.isSuccess ||
      getNotificationsPaginatedResult.isSuccess ||
      getUnreadCountResult.isSuccess ||
      getUnreadCountByContextResult.isSuccess ||
      getUnreadCountByActionResult.isSuccess,
  };
}

/**
 * Specialized hook for paginated notifications with lazy loading
 * Useful for implementing "Load More" functionality
 */
export function useLazyPaginatedNotifications() {
  const [triggerGetNotificationsPaginated, result] = useLazyGetNotificationsPaginatedQuery();
  const [triggerGetUnreadCount, unreadCountResult] = useLazyGetUnreadCountQuery();

  const loadPage = async (pageNumber: number, pageSize: number = 10, filters?: Partial<GetNotificationsPaginatedRequest>) => {
    const request: GetNotificationsPaginatedRequest = {
      pageNumber,
      pageSize,
      ...filters,
    };
    
    return triggerGetNotificationsPaginated(request);
  };

  const loadMore = async (currentPage: number, pageSize: number = 10, filters?: Partial<GetNotificationsPaginatedRequest>) => {
    return loadPage(currentPage + 1, pageSize, filters);
  };

  const refresh = async (pageNumber: number = 1, pageSize: number = 10, filters?: Partial<GetNotificationsPaginatedRequest>) => {
    const promises = [
      loadPage(pageNumber, pageSize, filters),
      triggerGetUnreadCount(),
    ];
    
    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh paginated notifications:', error);
      return { success: false, error };
    }
  };

  return {
    loadPage,
    loadMore,
    refresh,
    result,
    unreadCountResult,
    isLoading: result.isLoading || unreadCountResult.isLoading,
    hasError: result.isError || unreadCountResult.isError,
    isSuccess: result.isSuccess || unreadCountResult.isSuccess,
  };
}

/**
 * Hook for conditional notification fetching
 * Useful when you want to fetch notifications only under certain conditions
 */
export function useConditionalNotifications() {
  const [triggerGetUnreadCount, unreadCountResult] = useLazyGetUnreadCountQuery();
  const [triggerGetNotificationsPaginated, notificationsResult] = useLazyGetNotificationsPaginatedQuery();

  const fetchIfAuthenticated = async (isAuthenticated: boolean, request?: GetNotificationsPaginatedRequest) => {
    if (!isAuthenticated) {
      return { success: false, reason: 'Not authenticated' };
    }

    const promises = [
      triggerGetUnreadCount(),
      ...(request ? [triggerGetNotificationsPaginated(request)] : []),
    ];

    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch notifications for authenticated user:', error);
      return { success: false, error };
    }
  };

  const fetchOnFocus = async (request?: GetNotificationsPaginatedRequest) => {
    // Only fetch if window is focused
    if (document.hasFocus()) {
      return fetchIfAuthenticated(true, request);
    }
    return { success: false, reason: 'Window not focused' };
  };

  const fetchOnInterval = async (intervalMs: number, request?: GetNotificationsPaginatedRequest) => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        const result = await fetchIfAuthenticated(true, request);
        resolve(result);
      }, intervalMs);
      
      // Return cleanup function
      return () => clearTimeout(timeoutId);
    });
  };

  return {
    fetchIfAuthenticated,
    fetchOnFocus,
    fetchOnInterval,
    unreadCountResult,
    notificationsResult,
    isLoading: unreadCountResult.isLoading || notificationsResult.isLoading,
    hasError: unreadCountResult.isError || notificationsResult.isError,
    isSuccess: unreadCountResult.isSuccess || notificationsResult.isSuccess,
  };
}
