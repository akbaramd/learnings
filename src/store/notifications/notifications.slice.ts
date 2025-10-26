// src/store/notifications/notifications.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  NotificationState, 
  Notification, 
  PaginationInfo,
  UnreadCountResponse 
} from './notifications.types';

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  unreadCountByContext: {},
  unreadCountByAction: {},
  pagination: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Notification slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.pagination = null;
      state.error = null;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Update notification locally (optimistic update)
    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<Notification> & { notifications?: Notification[]; unreadCount?: number; unreadCountByContext?: Record<string, number>; unreadCountByAction?: Record<string, number> } }>) => {
      const { id, updates } = action.payload;
      
      // Handle bulk updates
      if (id === 'bulk' && updates.notifications) {
        state.notifications = updates.notifications;
        return;
      }
      
      if (id === 'unread-count' || id === 'unread-count-context' || id === 'unread-count-action') {
        if (updates.unreadCount !== undefined) {
          state.unreadCount = updates.unreadCount;
        }
        if (updates.unreadCountByContext) {
          state.unreadCountByContext = updates.unreadCountByContext;
        }
        if (updates.unreadCountByAction) {
          state.unreadCountByAction = updates.unreadCountByAction;
        }
        return;
      }
      
      if (id === 'all') {
        if (updates.notifications) {
          state.notifications = updates.notifications;
        }
        if (updates.unreadCount !== undefined) {
          state.unreadCount = updates.unreadCount;
        }
        if (updates.unreadCountByContext) {
          state.unreadCountByContext = updates.unreadCountByContext;
        }
        if (updates.unreadCountByAction) {
          state.unreadCountByAction = updates.unreadCountByAction;
        }
        return;
      }
      
      // Handle individual notification updates
      const index = state.notifications.findIndex(notification => notification.id === id);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
    },
    
    // Remove notification locally
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // Set pagination info
    setPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.pagination = action.payload;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Set last fetched timestamp
    setLastFetched: (state, action: PayloadAction<string>) => {
      state.lastFetched = action.payload;
    },
    
    // Reset state
    resetNotificationsState: () => initialState,
  },
});

// Export actions
export const {
  clearNotifications,
  clearError,
  updateNotification,
  removeNotification,
  setPagination,
  setLoading,
  setError,
  setLastFetched,
  resetNotificationsState,
} = notificationsSlice.actions;

// Export reducer
export default notificationsSlice.reducer;
