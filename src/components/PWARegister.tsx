'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    // PWA Startup Message
    console.log('%c🚀 PWA is running', 'color: #3A3080; font-size: 16px; font-weight: bold;');
    console.log('%cسامانه رفاهی - Progressive Web App', 'color: #10b981; font-size: 12px;');
    
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported in this browser');
      return;
    }

    // Check if we're in development (next-pwa disables PWA in dev by default)
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevelopment) {
      console.log('ℹ️ PWA is disabled in development mode');
      console.log('💡 Run "npm run build && npm start" to test PWA features');
    }

    // Wait for service worker to be ready
    const checkServiceWorker = () => {
      if (navigator.serviceWorker.controller) {
        console.log('✅ Service Worker is active and controlling the page');
        console.log('📱 PWA features enabled:');
        console.log('   - Offline support');
        console.log('   - App installation');
        console.log('   - Background sync');
        console.log('   - Push notifications (if configured)');
      } else {
        // Service worker might still be installing
        navigator.serviceWorker.ready.then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          console.log('🚀 PWA is running');
        }).catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
      }
    };

    // Check immediately
    checkServiceWorker();

    // Also check after a short delay to catch async registration
    const checkTimeout = setTimeout(checkServiceWorker, 1000);

    // Handle service worker updates
    let refreshing = false;
    
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        console.log('🔄 New service worker available');
        // Optionally show a notification to user before reload
        if (window.confirm('نسخه جدیدی از برنامه در دسترس است. آیا می‌خواهید صفحه را به‌روزرسانی کنید؟')) {
          window.location.reload();
        } else {
          refreshing = false;
        }
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Listen for service worker registration
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_READY') {
        console.log('✅ Service Worker is ready');
      }
    });

    // Check for updates periodically (next-pwa handles registration)
    const checkForUpdates = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    // Check for updates every hour
    const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);

    // Handle online/offline status
    const handleOnline = () => {
      console.log('🌐 App is online');
      // Optionally show notification or sync data
    };

    const handleOffline = () => {
      console.log('📴 App is offline - Using cached content');
      // Optionally show notification
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(checkTimeout);
      clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}

