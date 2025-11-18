/**
 * Service Worker
 * 
 * NOTE: This is a simple, empty service worker
 * No PWA features, no token refresh, no background sync
 */

// Simple service worker - no functionality
console.log('[Service Worker] Service worker loaded (empty)');

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  return self.clients.claim();
});

// Message event
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
