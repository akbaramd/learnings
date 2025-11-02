/**
 * Strongly typed environment configuration
 * 
 * This file centralizes all environment variables with proper typing
 * and validation. It ensures type safety across the application.
 */

/**
 * Server-side environment variables
 * These are only available in API routes and server components
 */
interface ServerEnv {
  /** Upstream API base URL for server-side API routes (BFF) */
  UPSTREAM_API_BASE_URL: string;
  
  /** CSRF secret for token generation */
  CSRF_SECRET: string;
  
  /** Node environment */
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Client-side environment variables
 * These are exposed to the browser (prefixed with NEXT_PUBLIC_)
 */
interface ClientEnv {
  /** Upstream API base URL for client-side image URLs and assets */
  NEXT_PUBLIC_UPSTREAM_API_BASE_URL: string;
  
  /** API base URL for RTK Query client (should be /api for BFF pattern) */
  NEXT_PUBLIC_API_BASE_URL: string;
}

/**
 * Server-side environment configuration
 * Validates and provides server-only env vars
 */
function getServerEnv(): ServerEnv {
  // Only call this on server side
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server side');
  }
  
  const UPSTREAM_API_BASE_URL = process.env.UPSTREAM_API_BASE_URL;
  const CSRF_SECRET = process.env.CSRF_SECRET;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  if (!UPSTREAM_API_BASE_URL) {
    const errorMessage = [
      'UPSTREAM_API_BASE_URL is required. Please set it in your .env file.',
      '',
      'Make sure you have:',
      '  1. Created .env.local file in the project root',
      '  2. Added UPSTREAM_API_BASE_URL=https://auth.wa-nezam.org',
      '  3. Restarted your Next.js dev server',
      '',
      'You can copy .env.example to .env.local and update the values.',
      '',
      `Current process.env.UPSTREAM_API_BASE_URL: ${process.env.UPSTREAM_API_BASE_URL || 'undefined'}`,
    ].join('\n');
    throw new Error(errorMessage);
  }

  if (!CSRF_SECRET) {
    console.warn(
      'CSRF_SECRET is not set. CSRF protection may not work correctly.'
    );
  }

  return {
    UPSTREAM_API_BASE_URL: UPSTREAM_API_BASE_URL.trim(),
    CSRF_SECRET: CSRF_SECRET || '',
    NODE_ENV: NODE_ENV as 'development' | 'production' | 'test',
  };
}

/**
 * Client-side environment configuration
 * Validates and provides client-accessible env vars
 * Note: In Next.js, NEXT_PUBLIC_ vars are available at build time
 */
function getClientEnv(): ClientEnv {
  const NEXT_PUBLIC_UPSTREAM_API_BASE_URL = process.env.NEXT_PUBLIC_UPSTREAM_API_BASE_URL;
  const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

  // Client env validation only happens at runtime, not module load
  // This allows the code to work even if env vars aren't set during development
  if (typeof window !== 'undefined' && !NEXT_PUBLIC_UPSTREAM_API_BASE_URL) {
    console.warn(
      'NEXT_PUBLIC_UPSTREAM_API_BASE_URL is not set. Image URLs may not work correctly.'
    );
  }

  return {
    NEXT_PUBLIC_UPSTREAM_API_BASE_URL: (NEXT_PUBLIC_UPSTREAM_API_BASE_URL || '').trim(),
    NEXT_PUBLIC_API_BASE_URL: NEXT_PUBLIC_API_BASE_URL.trim(),
  };
}

/**
 * Lazy server environment loader
 * Only evaluates when actually called on the server side
 * This prevents errors during client-side builds
 */
let _serverEnv: ServerEnv | null = null;

function getServerEnvLazy(): ServerEnv {
  // Only initialize on server side
  if (typeof window !== 'undefined') {
    throw new Error(
      'serverEnv can only be accessed on the server side. Use clientEnv or getUpstreamApiBaseUrl() for client-side code.'
    );
  }
  
  if (!_serverEnv) {
    _serverEnv = getServerEnv();
  }
  return _serverEnv;
}

/**
 * Server environment getter
 * Use this in API routes and server components only
 * Lazy-loaded to prevent errors during client builds
 */
export function getServerEnvSync(): ServerEnv {
  return getServerEnvLazy();
}

/**
 * Server environment instance (deprecated - use getServerEnvSync() for lazy loading)
 * Use this in API routes and server components only
 * Only access this if you're absolutely sure you're on the server
 */
export const serverEnv: ServerEnv = (() => {
  // Only evaluate on server side to prevent build errors
  if (typeof window === 'undefined') {
    try {
      return getServerEnv();
    } catch (error) {
      // Return a placeholder during build, will be properly loaded at runtime
      console.warn('Server env not available during build, will load at runtime');
      return {
        UPSTREAM_API_BASE_URL: '',
        CSRF_SECRET: '',
        NODE_ENV: 'development' as const,
      };
    }
  }
  // Return placeholder for client side
  return {
    UPSTREAM_API_BASE_URL: '',
    CSRF_SECRET: '',
    NODE_ENV: 'development' as const,
  };
})();

/**
 * Client environment instance
 * Use this in client components and browser-side code
 * Note: This is evaluated at module load, so it uses build-time env vars
 */
export const clientEnv: ClientEnv = getClientEnv();

/**
 * Helper to get upstream API base URL based on runtime context
 * - Returns server env in API routes/server components
 * - Returns client env in client components
 * - Handles missing env vars gracefully
 */
export function getUpstreamApiBaseUrl(): string {
  // Check if we're in a server context
  if (typeof window === 'undefined') {
    // Server side - use lazy loader
    try {
      const env = getServerEnvLazy();
      return env.UPSTREAM_API_BASE_URL;
    } catch (error) {
      // Fallback during build or if env not available
      const fallback = process.env.UPSTREAM_API_BASE_URL;
      if (fallback) {
        return fallback.trim();
      }
      throw new Error(
        'UPSTREAM_API_BASE_URL is required on the server. Please set it in your .env.local file.'
      );
    }
  }
  
  // Client context - access env var directly
  const clientBaseUrl = process.env.NEXT_PUBLIC_UPSTREAM_API_BASE_URL;
  if (!clientBaseUrl) {
    console.warn(
      'NEXT_PUBLIC_UPSTREAM_API_BASE_URL is not set. Image URLs may not work correctly.'
    );
    // Return empty string or fallback instead of throwing
    return '';
  }
  return clientBaseUrl.trim();
}

/**
 * Helper to build image URLs from relative paths
 * Handles both client and server contexts
 * Returns empty string if base URL is not available (client-side)
 */
export function buildImageUrl(relativePath: string): string {
  if (!relativePath) {
    return '';
  }
  
  const baseUrl = getUpstreamApiBaseUrl();
  
  // If base URL is empty (client-side env not set), return empty or relative path
  if (!baseUrl) {
    console.warn(
      'buildImageUrl: NEXT_PUBLIC_UPSTREAM_API_BASE_URL is not set. Returning relative path.'
    );
    // Return the relative path as-is if no base URL available
    return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  }
  
  // Remove leading slash from relativePath if present, or ensure it starts with /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${baseUrl}${cleanPath}`;
}

