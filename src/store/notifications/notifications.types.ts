// src/store/notifications/notifications.types.ts
// All notification-related types

// Core notification data structure
export interface Notification {
  id?: string;
  title?: string | null;
  message?: string | null;
  context?: string | null;
  action?: string | null;
  isRead?: boolean;
  createdAt?: string;
  expiresAt?: string | null;
  data?: unknown | null;
  hasAction?: boolean;
  isExpired?: boolean;
}

// Pagination structure
export interface PaginationInfo {
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

// Paginated notifications result
export interface NotificationPaginatedResult {
  items?: Notification[] | null;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

// Unread count response
export interface UnreadCountResponse {
  totalCount?: number;
  contextBreakdown?: Record<string, number | null>;
  actionBreakdown?: Record<string, number | null>;
}

// Request types for API calls
export interface GetNotificationsPaginatedRequest {
  pageNumber: number;
  pageSize: number;
  isRead?: boolean;
  context?: string;
  action?: string;
}

export interface GetAllNotificationsRequest {
  isRead?: boolean;
  context?: string;
  action?: string;
}

export interface MarkByContextAsReadRequest {
  context?: string | null;
}

export interface MarkByActionAsReadRequest {
  action?: string | null;
}

// Generic API response wrapper
export interface ApiResponse<T = unknown | null> {
  result: T | null;
  errors: string[] | null;
}

// Specific response types for each endpoint
export interface GetNotificationsPaginatedResponse {
  result: NotificationPaginatedResult | null;
  errors: string[] | null;
}

export interface GetAllNotificationsResponse {
  result: NotificationPaginatedResult | null;
  errors: string[] | null;
}

export interface GetUnreadCountResponse {
  result: UnreadCountResponse | null;
  errors: string[] | null;
}

export interface GetUnreadCountByContextResponse {
  result: UnreadCountResponse | null;
  errors: string[] | null;
}

export interface GetUnreadCountByActionResponse {
  result: UnreadCountResponse | null;
  errors: string[] | null;
}

export interface MarkAsReadResponse {
  result: { success: boolean } | null;
  errors: string[] | null;
}

export interface MarkAllAsReadResponse {
  result: { success: boolean } | null;
  errors: string[] | null;
}

export interface MarkByContextAsReadResponse {
  result: { success: boolean } | null;
  errors: string[] | null;
}

export interface MarkByActionAsReadResponse {
  result: { success: boolean } | null;
  errors: string[] | null;
}

// Notification state for Redux store
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  unreadCountByContext: Record<string, number>;
  unreadCountByAction: Record<string, number>;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

// Filter options for notifications
export interface NotificationFilters {
  isRead?: boolean;
  context?: string;
  action?: string;
}

// Notification context types (commonly used contexts)
export type NotificationContext = 
  | 'system'
  | 'payment'
  | 'booking'
  | 'promotion'
  | 'security'
  | 'update'
  | 'reminder';

// Notification action types (commonly used actions)
export type NotificationAction = 
  | 'view'
  | 'pay'
  | 'book'
  | 'confirm'
  | 'cancel'
  | 'update'
  | 'delete'
  | 'share';
