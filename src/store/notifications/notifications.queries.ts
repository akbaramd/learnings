// src/store/notifications/notifications.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  GetNotificationsPaginatedRequest,
  GetAllNotificationsRequest,
  MarkByContextAsReadRequest,
  MarkByActionAsReadRequest,
  GetNotificationsPaginatedResponse,
  GetAllNotificationsResponse,
  GetUnreadCountResponse,
  GetUnreadCountByContextResponse,
  GetUnreadCountByActionResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  MarkByContextAsReadResponse,
  MarkByActionAsReadResponse,
  PaginationInfo,
} from './notifications.types';
import {
  clearNotifications,
  clearError,
  updateNotification,
  setPagination,
} from './notifications.slice';

// Error handling utility
export const handleNotificationsApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as Record<string, unknown>;
    if (apiError?.data && typeof apiError.data === 'object') {
      const data = apiError.data as Record<string, unknown>;
      if (Array.isArray(data.errors) && data.errors[0]) {
        return String(data.errors[0]);
      }
      if (data.message) {
        return String(data.message);
      }
    }
    if (apiError.message) {
      return String(apiError.message);
    }
  }
  return 'An unexpected error occurred';
};

// Notifications API slice
export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/notifications',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Notifications', 'UnreadCount'],
  // Add proper caching configuration
  keepUnusedDataFor: 300, // Keep data for 5 minutes
  refetchOnMountOrArgChange: false, // Don't refetch on mount
  refetchOnFocus: false, // Don't refetch on window focus
  refetchOnReconnect: true, // Refetch when reconnecting
  endpoints: (builder) => ({
    // Get all notifications with optional filtering
    getAllNotifications: builder.query<GetAllNotificationsResponse, GetAllNotificationsRequest>({
      query: (filters) => {
        const searchParams = new URLSearchParams();
        
        if (filters.isRead !== undefined) {
          searchParams.append('isRead', filters.isRead.toString());
        }
        if (filters.context) {
          searchParams.append('context', filters.context);
        }
        if (filters.action) {
          searchParams.append('action', filters.action);
        }

        return {
          url: `/user${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Notifications'],
      keepUnusedDataFor: 300, // Keep notifications for 5 minutes
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update notifications in slice
            dispatch(clearNotifications());
            dispatch(updateNotification({ 
              id: 'bulk', 
              updates: { notifications: data.result.items || [] } 
            }));
            
            // Update pagination
            const pagination: PaginationInfo = {
              pageNumber: data.result.pageNumber || 1,
              pageSize: data.result.pageSize || 10,
              totalPages: data.result.totalPages || 1,
              totalCount: data.result.totalCount || 0,
              hasPreviousPage: (data.result.pageNumber || 1) > 1,
              hasNextPage: (data.result.pageNumber || 1) < (data.result.totalPages || 1),
            };
            dispatch(setPagination(pagination));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Get paginated notifications
    getNotificationsPaginated: builder.query<GetNotificationsPaginatedResponse, GetNotificationsPaginatedRequest>({
      query: (request) => {
        const searchParams = new URLSearchParams();
        
        searchParams.append('pageNumber', request.pageNumber.toString());
        searchParams.append('pageSize', request.pageSize.toString());
        
        if (request.isRead !== undefined) {
          searchParams.append('isRead', request.isRead.toString());
        }
        if (request.context) {
          searchParams.append('context', request.context);
        }
        if (request.action) {
          searchParams.append('action', request.action);
        }

        return {
          url: `/user/paginated?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Notifications'],
      keepUnusedDataFor: 300, // Keep paginated data for 5 minutes
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update notifications in slice
            dispatch(clearNotifications());
            dispatch(updateNotification({ 
              id: 'bulk', 
              updates: { notifications: data.result.items || [] } 
            }));
            
            // Update pagination
            const pagination: PaginationInfo = {
              pageNumber: data.result.pageNumber || arg.pageNumber,
              pageSize: data.result.pageSize || arg.pageSize,
              totalPages: data.result.totalPages || 1,
              totalCount: data.result.totalCount || 0,
              hasPreviousPage: (data.result.pageNumber || arg.pageNumber) > 1,
              hasNextPage: (data.result.pageNumber || arg.pageNumber) < (data.result.totalPages || 1),
            };
            dispatch(setPagination(pagination));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Get unread count
    getUnreadCount: builder.query<GetUnreadCountResponse, void>({
      query: () => ({
        url: '/user/unread-count',
        method: 'GET',
      }),
      providesTags: ['UnreadCount'],
      keepUnusedDataFor: 60, // Keep unread count for 1 minute (more frequent updates)
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update unread counts in slice
            dispatch(updateNotification({ 
              id: 'unread-count', 
              updates: { 
                unreadCount: data.result.totalCount || 0,
                unreadCountByContext: Object.fromEntries(
                  Object.entries(data.result.contextBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
                unreadCountByAction: Object.fromEntries(
                  Object.entries(data.result.actionBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Get unread count by context
    getUnreadCountByContext: builder.query<GetUnreadCountByContextResponse, void>({
      query: () => ({
        url: '/user/unread-count/context',
        method: 'GET',
      }),
      providesTags: ['UnreadCount'],
      keepUnusedDataFor: 60, // Keep context breakdown for 1 minute
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update unread counts in slice
            dispatch(updateNotification({ 
              id: 'unread-count-context', 
              updates: { 
                unreadCount: data.result.totalCount || 0,
                unreadCountByContext: Object.fromEntries(
                  Object.entries(data.result.contextBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
                unreadCountByAction: Object.fromEntries(
                  Object.entries(data.result.actionBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Get unread count by action
    getUnreadCountByAction: builder.query<GetUnreadCountByActionResponse, void>({
      query: () => ({
        url: '/user/unread-count/action',
        method: 'GET',
      }),
      providesTags: ['UnreadCount'],
      keepUnusedDataFor: 60, // Keep action breakdown for 1 minute
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result) {
            // Update unread counts in slice
            dispatch(updateNotification({ 
              id: 'unread-count-action', 
              updates: { 
                unreadCount: data.result.totalCount || 0,
                unreadCountByContext: Object.fromEntries(
                  Object.entries(data.result.contextBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
                unreadCountByAction: Object.fromEntries(
                  Object.entries(data.result.actionBreakdown || {}).map(([key, value]) => [key, value || 0])
                ),
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Mark specific notification as read
    markAsRead: builder.mutation<MarkAsReadResponse, string>({
      query: (notificationId) => ({
        url: `/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
      async onQueryStarted(notificationId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result?.success) {
            // Optimistically update the notification
            dispatch(updateNotification({ 
              id: notificationId, 
              updates: { isRead: true } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Mark all notifications as read
    markAllAsRead: builder.mutation<MarkAllAsReadResponse, void>({
      query: () => ({
        url: '/user/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result?.success) {
            // Mark all notifications as read in slice
            dispatch(updateNotification({ 
              id: 'all', 
              updates: { 
                notifications: [], // Clear notifications
                unreadCount: 0,
                unreadCountByContext: {},
                unreadCountByAction: {},
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Mark notifications by context as read
    markByContextAsRead: builder.mutation<MarkByContextAsReadResponse, MarkByContextAsReadRequest>({
      query: (request) => ({
        url: '/user/mark-context-read',
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result?.success && request.context) {
            // Mark notifications by context as read in slice
            dispatch(updateNotification({ 
              id: `context-${request.context}`, 
              updates: { 
                // This would need to be handled differently in the slice
                // For now, we'll invalidate the cache to refetch
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),

    // Mark notifications by action as read
    markByActionAsRead: builder.mutation<MarkByActionAsReadResponse, MarkByActionAsReadRequest>({
      query: (request) => ({
        url: '/user/mark-action-read',
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
      async onQueryStarted(request, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data?.result?.success && request.action) {
            // Mark notifications by action as read in slice
            dispatch(updateNotification({ 
              id: `action-${request.action}`, 
              updates: { 
                // This would need to be handled differently in the slice
                // For now, we'll invalidate the cache to refetch
              } 
            }));
          }
        } catch (error: unknown) {
          handleNotificationsApiError(error);
          dispatch(clearError());
        }
      },
    }),
  }),
});

// Export hooks for components
export const {
  useGetAllNotificationsQuery,
  useGetNotificationsPaginatedQuery,
  useGetUnreadCountQuery,
  useGetUnreadCountByContextQuery,
  useGetUnreadCountByActionQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useMarkByContextAsReadMutation,
  useMarkByActionAsReadMutation,
  // Lazy query hooks
  useLazyGetAllNotificationsQuery,
  useLazyGetNotificationsPaginatedQuery,
  useLazyGetUnreadCountQuery,
  useLazyGetUnreadCountByContextQuery,
  useLazyGetUnreadCountByActionQuery,
} = notificationsApi;

// Export the API slice
export default notificationsApi;
