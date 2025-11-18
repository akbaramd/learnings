/**
 * Background Sync Utility for PWA
 * Provides background token refresh and sync capabilities for offline support
 */

import { isPWAAvailable } from './pwa-storage';

// Type definitions for Background Sync API
interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: SyncManager;
}

const SYNC_TAG_REFRESH_TOKEN = 'refresh-token';
const SYNC_TAG_SYNC_DATA = 'sync-data';

/**
 * Register background sync for token refresh
 * This allows token refresh to happen in the background even when the app is closed
 */
export async function registerTokenRefreshSync(): Promise<boolean> {
  if (!isPWAAvailable()) {
    console.warn('[Background Sync] PWA features not available');
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;

      if (registration.sync) {
        await registration.sync.register(SYNC_TAG_REFRESH_TOKEN);
        console.log('[Background Sync] Token refresh sync registered');
        return true;
      } else {
        console.warn('[Background Sync] Background sync not supported');
        return false;
      }
    }
  } catch (error) {
    console.error('[Background Sync] Failed to register token refresh sync:', error);
    return false;
  }

  return false;
}

/**
 * Register background sync for general data synchronization
 */
export async function registerDataSync(): Promise<boolean> {
  if (!isPWAAvailable()) {
    console.warn('[Background Sync] PWA features not available');
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;

      if (registration.sync) {
        await registration.sync.register(SYNC_TAG_SYNC_DATA);
        console.log('[Background Sync] Data sync registered');
        return true;
      }
    }
  } catch (error) {
    console.error('[Background Sync] Failed to register data sync:', error);
    return false;
  }

  return false;
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'serviceWorker' in navigator &&
    'sync' in window.ServiceWorkerRegistration.prototype
  );
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  supported: boolean;
  registered: boolean;
  tags: string[];
}> {
  const supported = isBackgroundSyncSupported();
  let registered = false;
  const tags: string[] = [];

  if (supported && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
      
      if (registration.sync) {
        const syncManager = registration.sync;
        const syncTags = await syncManager.getTags();
        tags.push(...syncTags);
        registered = syncTags.length > 0;
      }
    } catch (error) {
      console.error('[Background Sync] Failed to get sync status:', error);
    }
  }

  return {
    supported,
    registered,
    tags,
  };
}

