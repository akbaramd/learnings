'use client';

import { useEffect, useRef } from 'react';
import { getDeviceId } from '@/src/lib/deviceInfo';

// Use the same key as deviceInfo.ts for consistency
const DEVICE_ID_KEY = 'device_id';

/**
 * DeviceIdInitializer Component
 * 
 * Initializes and ensures device ID exists in localStorage at app startup.
 * This runs FIRST before any other initializers to ensure device ID is always available.
 * 
 * The device ID is:
 * - Generated once and stored permanently in localStorage
 * - Persists across browser sessions (closing/reopening browser)
 * - Persists across page refreshes
 * - Only changes if user clears browser data or manually clears it
 * - Acts as a constant string identifier for the device
 * 
 * This is a CRITICAL component - device ID must be initialized before any API calls.
 */
export function DeviceIdInitializer() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Ensure device ID exists - getDeviceId() will:
    // 1. Check if device ID exists in localStorage
    // 2. If exists, return it (persists across sessions)
    // 3. If not exists, generate new one and store it permanently
    try {
      const deviceId = getDeviceId();
      
      if (deviceId && deviceId.startsWith('device-')) {
        console.log('[DeviceId] Device ID initialized:', deviceId);
        
        // Verify it's stored in localStorage (should be, but double-check)
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(DEVICE_ID_KEY);
          if (!stored || stored !== deviceId) {
            // If not properly stored or different, store it now
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
            console.log('[DeviceId] Device ID stored in localStorage');
          }
        }
      } else {
        console.error('[DeviceId] Invalid device ID generated:', deviceId);
      }
    } catch (error) {
      console.error('[DeviceId] Failed to initialize device ID:', error);
      // Non-critical error - app can continue, but device ID may not be available
    }
  }, []);

  // This component doesn't render anything
  return null;
}

