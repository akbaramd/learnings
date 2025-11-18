/**
 * Service Worker for PWA Support
 * Handles background sync, offline support, and token refresh
 */

const CACHE_NAME = 'auth-cache-v1';
const SYNC_TAG_REFRESH_TOKEN = 'refresh-token';
const SYNC_TAG_SYNC_DATA = 'sync-data';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Background sync event - handle token refresh
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === SYNC_TAG_REFRESH_TOKEN) {
    event.waitUntil(refreshTokenInBackground());
  } else if (event.tag === SYNC_TAG_SYNC_DATA) {
    event.waitUntil(syncDataInBackground());
  }
});

/**
 * Refresh token in background
 * This is called when the app is offline or in the background
 */
async function refreshTokenInBackground() {
  try {
    console.log('[Service Worker] Refreshing token in background...');

    // Get refresh token from IndexedDB
    const refreshToken = await getRefreshTokenFromIndexedDB();

    if (!refreshToken) {
      console.warn('[Service Worker] No refresh token found in IndexedDB');
      return;
    }

    // Call refresh token API
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Service Worker] Token refreshed successfully');

      // Save new refresh token to IndexedDB if provided
      if (data?.data?.refreshToken) {
        await saveRefreshTokenToIndexedDB(data.data.refreshToken);
      }

      // Notify all clients about successful refresh
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'TOKEN_REFRESHED',
          data: data.data,
        });
      });
    } else {
      console.error('[Service Worker] Token refresh failed:', response.status);
      
      // Notify clients about failure
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'TOKEN_REFRESH_FAILED',
          error: `HTTP ${response.status}`,
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Error refreshing token:', error);
    
    // Notify clients about error
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'TOKEN_REFRESH_ERROR',
        error: error.message,
      });
    });
  }
}

/**
 * Sync data in background
 */
async function syncDataInBackground() {
  try {
    console.log('[Service Worker] Syncing data in background...');
    
    // Get pending sync operations from IndexedDB
    const pendingOps = await getPendingSyncOperations();
    
    for (const op of pendingOps) {
      try {
        const response = await fetch(op.url, {
          method: op.method,
          headers: op.headers,
          body: op.body,
          credentials: 'include',
        });

        if (response.ok) {
          // Remove from pending operations
          await removePendingSyncOperation(op.id);
          console.log('[Service Worker] Synced operation:', op.id);
        } else {
          console.error('[Service Worker] Sync operation failed:', op.id, response.status);
        }
      } catch (error) {
        console.error('[Service Worker] Error syncing operation:', op.id, error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Error in background sync:', error);
  }
}

/**
 * Get refresh token from IndexedDB
 * Note: This is a simplified version. In production, use the pwa-storage module
 */
async function getRefreshTokenFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('auth-tokens', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['tokens'], 'readonly');
      const store = transaction.objectStore('tokens');
      const getRequest = store.get('refreshToken');
      
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        resolve(data?.refreshToken || null);
      };
      
      getRequest.onerror = () => {
        resolve(null);
      };
    };
    
    request.onerror = () => {
      resolve(null);
    };
  });
}

/**
 * Save refresh token to IndexedDB
 */
async function saveRefreshTokenToIndexedDB(token) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('auth-tokens', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['tokens'], 'readwrite');
      const store = transaction.objectStore('tokens');
      
      const putRequest = store.put({
        refreshToken: token,
        encryptedAt: Date.now(),
        expiresAt: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days
      }, 'refreshToken');
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending sync operations from IndexedDB
 */
async function getPendingSyncOperations() {
  // Implementation depends on your sync queue structure
  return [];
}

/**
 * Remove pending sync operation from IndexedDB
 */
async function removePendingSyncOperation(id) {
  // Implementation depends on your sync queue structure
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - handle network requests (optional, for offline support)
self.addEventListener('fetch', (event) => {
  // Only handle API requests for offline support
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request);
        })
    );
  }
});

