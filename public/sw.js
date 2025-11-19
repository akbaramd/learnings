/**
 * Service Worker
 * 
 * NOTE: This is a simple, empty service worker
 * No PWA features, no token refresh, no background sync
 * 
 * CRITICAL: NextAuth endpoints must always bypass service worker
 * to prevent NetworkError when fetching session
 */

// Simple service worker - no functionality
console.log('[Service Worker] Service worker loaded (empty)');

// CRITICAL: Fetch event handler to bypass NextAuth endpoints
// This ensures NextAuth session requests always go to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Bypass service worker for NextAuth endpoints
  // This prevents NetworkError when NextAuth tries to fetch session
  if (url.pathname.startsWith('/api/auth/')) {
    // Let the request pass through to network without interception
    return;
  }
  
  // For all other requests, use default behavior
});

// Install event
self.addEventListener('install', () => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', () => {
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
