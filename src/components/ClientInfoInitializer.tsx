'use client';

import { useEffect, useRef } from 'react';
import { fetchClientInfo } from '@/src/lib/deviceInfo';

/**
 * ClientInfoInitializer Component
 * 
 * Fetches and caches client IP address and user agent on app initialization.
 * This runs once when the app starts and stores the info in localStorage
 * for use in subsequent API requests.
 * 
 * Performance:
 * - Only fetches once per session (cached for 24 hours)
 * - Non-blocking (doesn't delay app rendering)
 * - Falls back gracefully if fetch fails
 */
export function ClientInfoInitializer() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Fetch client info asynchronously (non-blocking)
    fetchClientInfo()
      .then((info) => {
        if (info.ipAddress) {
          console.log('[ClientInfo] IP address cached:', info.ipAddress.substring(0, 10) + '...');
        } else {
          console.warn('[ClientInfo] IP address not available (will use server-side extraction)');
        }
      })
      .catch((error) => {
        console.error('[ClientInfo] Failed to fetch client info:', error);
        // Non-critical error - app continues to work, IP will be extracted server-side
      });
  }, []);

  // This component doesn't render anything
  return null;
}

