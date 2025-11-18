/**
 * PWA Storage Utility
 * Provides secure token storage using IndexedDB with encryption for PWA support
 * 
 * This module implements secure storage for refresh tokens in PWA environments
 * where httpOnly cookies may not be reliable or when offline support is needed.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TokenDB extends DBSchema {
  tokens: {
    key: string;
    value: {
      refreshToken: string;
      encryptedAt: number;
      expiresAt: number;
    };
  };
}

let db: IDBPDatabase<TokenDB> | null = null;
let initPromise: Promise<IDBPDatabase<TokenDB>> | null = null;

/**
 * Initialize IndexedDB for token storage
 * Uses singleton pattern to prevent multiple initializations
 */
export async function initTokenDB(): Promise<IDBPDatabase<TokenDB>> {
  if (db) {
    return db;
  }

  if (initPromise) {
    return initPromise;
  }

  if (typeof window === 'undefined') {
    throw new Error('IndexedDB is only available in browser environment');
  }

  initPromise = openDB<TokenDB>('auth-tokens', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens');
      }
    },
  });

  db = await initPromise;
  return db;
}

/**
 * Generate encryption key for token storage
 * Uses Web Crypto API for secure key generation
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Use a deterministic key derivation from a constant seed
  // In production, consider using a more secure key management approach
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('auth-token-encryption-key-v1'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('auth-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt token using AES-GCM
 */
async function encryptToken(token: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt token using AES-GCM
 */
async function decryptToken(encrypted: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[PWA Storage] Decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Save refresh token to IndexedDB with encryption
 * 
 * @param token - Refresh token to save
 * @param expiresIn - Expiration time in seconds (default: 60 days)
 */
export async function saveRefreshToken(
  token: string,
  expiresIn: number = 60 * 24 * 60 * 60 // 60 days in seconds
): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('[PWA Storage] Cannot save token in server environment');
    return;
  }

  try {
    const database = await initTokenDB();
    const encrypted = await encryptToken(token);
    const expiresAt = Date.now() + (expiresIn * 1000);

    await database.put(
      'tokens',
      {
        refreshToken: encrypted,
        encryptedAt: Date.now(),
        expiresAt: expiresAt,
      },
      'refreshToken'
    );

    console.log('[PWA Storage] Refresh token saved successfully');
  } catch (error) {
    console.error('[PWA Storage] Failed to save refresh token:', error);
    throw error;
  }
}

/**
 * Get refresh token from IndexedDB and decrypt it
 * 
 * @returns Decrypted refresh token or null if not found/expired
 */
export async function getRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.warn('[PWA Storage] Cannot get token in server environment');
    return null;
  }

  try {
    const database = await initTokenDB();
    const stored = await database.get('tokens', 'refreshToken');

    if (!stored) {
      console.log('[PWA Storage] No refresh token found in IndexedDB');
      return null;
    }

    // Check if token is expired
    if (stored.expiresAt && stored.expiresAt < Date.now()) {
      console.log('[PWA Storage] Refresh token expired, removing...');
      await clearRefreshToken();
      return null;
    }

    const decrypted = await decryptToken(stored.refreshToken);
    return decrypted;
  } catch (error) {
    console.error('[PWA Storage] Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Clear refresh token from IndexedDB
 */
export async function clearRefreshToken(): Promise<void> {
  if (typeof window === 'undefined') {
    console.warn('[PWA Storage] Cannot clear token in server environment');
    return;
  }

  try {
    const database = await initTokenDB();
    await database.delete('tokens', 'refreshToken');
    console.log('[PWA Storage] Refresh token cleared');
  } catch (error) {
    console.error('[PWA Storage] Failed to clear refresh token:', error);
  }
}

/**
 * Check if IndexedDB is available and supported
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'indexedDB' in window && indexedDB !== null;
}

/**
 * Check if PWA features are available
 */
export function isPWAAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'serviceWorker' in navigator &&
    'sync' in window.ServiceWorkerRegistration.prototype &&
    isIndexedDBAvailable()
  );
}

