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
    // Only initialize once per component mount
    if (initializedRef.current) return;
    initializedRef.current = true;

    // CRITICAL: Ensure device ID exists in localStorage
    // getDeviceId() will:
    // 1. Check if device ID exists in localStorage FIRST
    // 2. If exists, return it immediately (NO REGENERATION)
    // 3. If NOT exists, generate new one ONCE and store it permanently
    // 4. Once stored, it NEVER changes or refreshes
    try {
      if (typeof window === 'undefined') {
        // Server-side: skip initialization
        return;
      }

      // Call getDeviceId() - it handles all logic:
      // - Returns existing ID if found (no regeneration)
      // - Generates new ID only if not found (one-time generation)
      // - Stores it permanently (never refreshes)
      const deviceId = getDeviceId();
      
      // Verify the device ID is valid
      if (deviceId && deviceId.startsWith('device-') && deviceId.length > 7) {
        // Double-check it's stored (getDeviceId() should have stored it, but verify)
          const stored = localStorage.getItem(DEVICE_ID_KEY);
        if (stored === deviceId) {
          // Perfect! Device ID exists and is stored correctly
          if (process.env.NODE_ENV === 'development') {
            console.log('[DeviceId] Device ID verified and ready:', deviceId.substring(0, 20) + '...');
          }
        } else if (!stored) {
          // Edge case: getDeviceId() returned a fallback ID (localStorage unavailable)
          // Store it anyway if possible
          try {
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
            if (process.env.NODE_ENV === 'development') {
              console.log('[DeviceId] Device ID stored (fallback case):', deviceId.substring(0, 20) + '...');
            }
          } catch {
            // localStorage still unavailable, can't store
            if (process.env.NODE_ENV === 'development') {
              console.warn('[DeviceId] Cannot store device ID (localStorage unavailable)');
            }
          }
        } else {
          // Stored ID differs from returned ID - this shouldn't happen
          // Keep the stored one (it's the persistent one)
          if (process.env.NODE_ENV === 'development') {
            console.warn('[DeviceId] Stored ID differs from returned ID, using stored:', stored.substring(0, 20) + '...');
          }
        }
      } else {
        console.error('[DeviceId] Invalid device ID format:', deviceId);
      }
    } catch (error) {
      console.error('[DeviceId] Failed to initialize device ID:', error);
      // Non-critical error - app can continue, but device ID may not be available
      // API calls will still work, but session management may be affected
    }
  }, []);

  // This component doesn't render anything
  return null;
}

