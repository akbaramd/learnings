'use client';

/**
 * PWA Initializer Component
 * 
 * NOTE: This component is currently empty/disabled
 * PWA features have been removed
 */

export function PWAInitializer() {
  // Empty component - no PWA functionality
  return null;
}

/**
 * Hook to check PWA features status
 */
export function usePWAStatus() {
  return {
    available: false,
    indexedDB: false,
    backgroundSync: false,
    serviceWorker: false,
  };
}
