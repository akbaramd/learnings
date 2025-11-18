/**
 * Device Information Utility
 * Provides deviceId, userAgent, IP address, and helper functions for device identification
 * DeviceId and IP address are stored in localStorage to persist across sessions
 */

const DEVICE_ID_KEY = 'device_id';
const CLIENT_INFO_KEY = 'client_info';
// Device ID should NEVER expire - it's a permanent identifier for this device
// Only clear it manually (e.g., on logout) or if user clears browser data
const CLIENT_INFO_CACHE_HOURS = 24; // Cache IP address for 24 hours

/**
 * Generate a unique device ID using UUID
 * 
 * Uses crypto.randomUUID() for generating a standard UUID v4.
 * The UUID is generated once and stored permanently in localStorage.
 * 
 * IMPORTANT: The UUID is generated randomly, but once stored, it acts as a constant
 * identifier that never changes for the lifetime of the browser installation.
 * 
 * Format: Standard UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * 
 * Fallback: If crypto.randomUUID() is not available (older browsers),
 * falls back to a custom UUID-like generation method.
 */
function generateDeviceId(): string {
  // Try to use browser's built-in crypto.randomUUID() (available in modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      const uuid = crypto.randomUUID();
      // Format: device-{uuid} to maintain consistency with previous format
      return `device-${uuid}`;
    } catch (error) {
      console.warn('[DeviceInfo] crypto.randomUUID() failed, using fallback:', error);
    }
  }

  // Fallback: Generate UUID-like string manually
  // This ensures compatibility with older browsers
  function generateUUIDFallback(): string {
    // Generate random hex values
    const hex = (n: number) => {
      const arr = new Uint8Array(n);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(arr);
      } else {
        // Last resort: use Math.random (less secure, but works everywhere)
        for (let i = 0; i < n; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
      }
      return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
    };

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B
    const parts = [
      hex(4),           // 8 hex digits
      hex(2),           // 4 hex digits
      '4' + hex(1),     // 4xxx (version 4)
      ((parseInt(hex(1), 16) & 0x3) | 0x8).toString(16) + hex(1), // yxxx (variant)
      hex(6),           // 12 hex digits
    ];

    return parts.join('-');
  }

  const uuid = generateUUIDFallback();
  // Format: device-{uuid} to maintain consistency
  return `device-${uuid}`;
}

/**
 * Get or create a persistent device ID
 * 
 * IMPORTANT: This function is called at app startup by DeviceIdInitializer
 * to ensure device ID exists before any API calls are made.
 * 
 * Device ID is stored permanently in localStorage as a plain string (no expiry)
 * It persists across:
 * - Browser sessions (closing/reopening browser)
 * - Page refreshes
 * - Tab closes/opens
 * - System restarts
 * 
 * It only changes if:
 * 1. User clears browser data (localStorage)
 * 2. User manually clears it via clearDeviceId()
 * 3. Browser/device characteristics fundamentally change (rare)
 * 
 * Storage format: Plain string (e.g., "device-abc123") for maximum persistence
 */
/**
 * Get or create a persistent device ID
 * 
 * CRITICAL: This function generates the device ID ONLY ONCE.
 * Once stored in localStorage, it is NEVER regenerated or refreshed.
 * 
 * Behavior:
 * 1. First check: If device ID exists in localStorage, return it immediately (NO REGENERATION)
 * 2. Only if NOT found: Generate new one and store it permanently
 * 3. Once stored, it persists forever until user clears browser data
 * 
 * IMPORTANT: This function is called at app startup by DeviceIdInitializer
 * to ensure device ID exists before any API calls are made.
 * 
 * Device ID is stored permanently in localStorage as a plain string (no expiry)
 * It persists across:
 * - Browser sessions (closing/reopening browser)
 * - Page refreshes
 * - Tab closes/opens
 * - System restarts
 * 
 * It only changes if:
 * 1. User clears browser data (localStorage)
 * 2. User manually clears it via clearDeviceId()
 * 
 * Storage format: Plain string (e.g., "device-abc123") for maximum persistence
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (will be replaced by client)
    return 'server-device-id';
  }

  try {
    // CRITICAL: Check if device ID already exists in localStorage FIRST
    // If it exists, return it immediately - NEVER regenerate
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    
    if (stored) {
      // Handle backward compatibility: Check if stored as JSON object (old format)
      if (stored.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(stored);
        // If stored as object with 'id' property (old format)
        if (parsed && typeof parsed === 'object' && parsed.id) {
          // Validate the stored ID format
          if (typeof parsed.id === 'string' && parsed.id.startsWith('device-')) {
            // Migrate to new format (plain string) for better persistence
              // This is a ONE-TIME migration, not a regeneration
            localStorage.setItem(DEVICE_ID_KEY, parsed.id);
              return parsed.id; // Return existing ID, don't generate new one
            }
          }
        } catch {
          // If JSON parsing fails, treat as invalid and continue to generation
        }
      } else {
        // Stored as plain string (preferred format)
        if (typeof stored === 'string' && stored.startsWith('device-') && stored.length > 7) {
          // Perfect! Already in the correct format - return it immediately
          // NO REGENERATION - this is the existing device ID
          return stored;
        }
      }
    }

    // ONLY generate if device ID does NOT exist in storage
    // This happens only on first visit or after user clears browser data
    const deviceId = generateDeviceId();
    
    // Store permanently (no expiry) - this is the device's permanent identifier
    // Store as plain string (not JSON) for maximum persistence and reliability
    // This ensures the device ID acts as a constant string that never changes
    localStorage.setItem(DEVICE_ID_KEY, deviceId);

    if (process.env.NODE_ENV === 'development') {
      console.log('[DeviceInfo] Generated new device ID (first time only):', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('[DeviceInfo] Error getting device ID:', error);
    // Fallback: generate a UUID even if localStorage fails
    // This ensures we always have a device ID, even in error scenarios
    // NOTE: This fallback is NOT stored, so it will regenerate on next call
    // This is acceptable as it only happens if localStorage is completely unavailable
    try {
      const fallbackId = generateDeviceId();
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DeviceInfo] Generated fallback device ID (not stored, will regenerate):', fallbackId);
      }
      return fallbackId;
    } catch {
      // Last resort: return a placeholder (should never happen)
      return 'device-unknown';
    }
  }
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  if (typeof window === 'undefined') {
    return 'server-user-agent';
  }
  return navigator.userAgent || 'unknown';
}

/**
 * Get device information object
 * Returns deviceId, userAgent, and other device characteristics
 */
export function getDeviceInfo(): {
  deviceId: string;
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
} {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server-device-id',
      userAgent: 'server-user-agent',
      language: 'en',
      platform: 'server',
      screenResolution: '0x0',
      timezone: 'UTC',
    };
  }

  return {
    deviceId: getDeviceId(),
    userAgent: getUserAgent(),
    language: navigator.language || 'en',
    platform: navigator.platform || 'unknown',
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}

/**
 * Clear stored device ID (useful for testing, logout, or privacy)
 * This will force generation of a new device ID on next call
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    console.log('[DeviceInfo] Device ID cleared');
  } catch (error) {
    console.error('[DeviceInfo] Error clearing device ID:', error);
  }
}

/**
 * Client info cache structure
 */
interface ClientInfoCache {
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: number;
}

/**
 * Get cached client info (IP address, user agent)
 */
function getCachedClientInfo(): ClientInfoCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CLIENT_INFO_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as ClientInfoCache;
    const now = Date.now();
    const cacheAge = now - parsed.timestamp;
    const cacheExpiry = CLIENT_INFO_CACHE_HOURS * 60 * 60 * 1000;

    // Check if cache is still valid
    if (cacheAge < cacheExpiry) {
      return parsed;
    }

    // Cache expired, remove it
    localStorage.removeItem(CLIENT_INFO_KEY);
    return null;
  } catch (error) {
    console.error('[DeviceInfo] Error reading cached client info:', error);
    return null;
  }
}

/**
 * Cache client info (IP address, user agent)
 */
function cacheClientInfo(info: ClientInfoCache): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CLIENT_INFO_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('[DeviceInfo] Error caching client info:', error);
  }
}

/**
 * Fetch client IP address and user agent from server
 * This is called once on app initialization
 */
export async function fetchClientInfo(): Promise<ClientInfoCache> {
  // Check cache first
  const cached = getCachedClientInfo();
  if (cached) {
    return cached;
  }

  // If not cached or expired, fetch from server
  try {
    const response = await fetch('/api/client-info', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch client info: ${response.status}`);
    }

    const data = await response.json() as ClientInfoCache;
    
    // Cache the result
    cacheClientInfo(data);
    
    return data;
  } catch (error) {
    console.error('[DeviceInfo] Error fetching client info:', error);
    
    // Return fallback values
    const fallback: ClientInfoCache = {
      ipAddress: null,
      userAgent: getUserAgent(),
      timestamp: Date.now(),
    };
    
    return fallback;
  }
}

/**
 * Get IP address from cache or return null
 * Use fetchClientInfo() first to populate the cache
 */
export function getCachedIpAddress(): string | null {
  const cached = getCachedClientInfo();
  return cached?.ipAddress || null;
}

/**
 * Get complete device info including cached IP address
 */
export async function getDeviceInfoWithIp(): Promise<{
  deviceId: string;
  userAgent: string;
  ipAddress: string | null;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
}> {
  const baseInfo = getDeviceInfo();
  
  // Try to get IP from cache, if not available, fetch it
  let ipAddress = getCachedIpAddress();
  if (!ipAddress) {
    const clientInfo = await fetchClientInfo();
    ipAddress = clientInfo.ipAddress;
  }

  return {
    ...baseInfo,
    ipAddress,
  };
}

