// src/store/notifications/index.ts
// Export all notification-related functionality

// Types
export * from './notifications.types';

// Queries (RTK Query API)
export * from './notifications.queries';

// Selectors
export * from './notifications.selectors';

// Slice and actions
export { default as notificationsReducer } from './notifications.slice';
export * from './notifications.slice';

// Re-export lazy query hooks for convenience
export {
  useLazyGetAllNotificationsQuery,
  useLazyGetNotificationsPaginatedQuery,
  useLazyGetUnreadCountQuery,
  useLazyGetUnreadCountByContextQuery,
  useLazyGetUnreadCountByActionQuery,
} from './notifications.queries';
