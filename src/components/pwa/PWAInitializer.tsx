'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/src/store';
import { 
  initTokenDB, 
  isPWAAvailable, 
  isIndexedDBAvailable 
} from '@/src/lib/pwa-storage';
import { 
  registerTokenRefreshSync, 
  isBackgroundSyncSupported 
} from '@/src/lib/background-sync';
import { initProactiveRefresh } from '@/src/lib/proactive-refresh';

/**
 * PWA Initializer Component
 * 
 * Initializes PWA features including:
 * - IndexedDB for token storage
 * - Background sync for token refresh
 * - Service worker registration
 * - Proactive token refresh
 * 
 * This component should be included in the root layout or app component
 */
export function PWAInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const [pwaReady, setPwaReady] = useState(false);
  const [features, setFeatures] = useState({
    indexedDB: false,
    backgroundSync: false,
    serviceWorker: false,
  });

  useEffect(() => {
    let mounted = true;

    async function initializePWA() {
      try {
        // Check PWA availability
        const pwaAvailable = isPWAAvailable();
        const indexedDBAvailable = isIndexedDBAvailable();
        const backgroundSyncAvailable = isBackgroundSyncSupported();

        console.log('[PWA Initializer] PWA features check:', {
          pwaAvailable,
          indexedDBAvailable,
          backgroundSyncAvailable,
        });

        // Initialize IndexedDB if available
        if (indexedDBAvailable) {
          try {
            await initTokenDB();
            setFeatures((prev) => ({ ...prev, indexedDB: true }));
            console.log('[PWA Initializer] IndexedDB initialized');
          } catch (error) {
            console.error('[PWA Initializer] Failed to initialize IndexedDB:', error);
          }
        }

        // Register background sync if available
        if (backgroundSyncAvailable) {
          try {
            const registered = await registerTokenRefreshSync();
            setFeatures((prev) => ({ ...prev, backgroundSync: registered }));
            if (registered) {
              console.log('[PWA Initializer] Background sync registered');
            }
          } catch (error) {
            console.error('[PWA Initializer] Failed to register background sync:', error);
          }
        }

        // Register service worker if available
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            });

            setFeatures((prev) => ({ ...prev, serviceWorker: true }));
            console.log('[PWA Initializer] Service worker registered:', registration.scope);

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA Initializer] New service worker available');
                    // Optionally show update notification to user
                  }
                });
              }
            });
          } catch (error) {
            console.error('[PWA Initializer] Failed to register service worker:', error);
          }
        }

        // Initialize proactive refresh
        // This will start the timer for token refresh before expiration
        try {
          await initProactiveRefresh(dispatch);
          console.log('[PWA Initializer] Proactive refresh initialized');
        } catch (error) {
          console.error('[PWA Initializer] Failed to initialize proactive refresh:', error);
        }

        if (mounted) {
          setPwaReady(true);
          console.log('[PWA Initializer] PWA initialization complete');
        }
      } catch (error) {
        console.error('[PWA Initializer] PWA initialization failed:', error);
      }
    }

    initializePWA();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to check PWA features status
 */
export function usePWAStatus() {
  const [status, setStatus] = useState({
    available: false,
    indexedDB: false,
    backgroundSync: false,
    serviceWorker: false,
  });

  useEffect(() => {
    const checkStatus = () => {
      setStatus({
        available: isPWAAvailable(),
        indexedDB: isIndexedDBAvailable(),
        backgroundSync: isBackgroundSyncSupported(),
        serviceWorker: 'serviceWorker' in navigator,
      });
    };

    checkStatus();
  }, []);

  return status;
}

