/**
 * Logout utility following NextAuth best practices
 * 
 * Pattern:
 * 1. Call backend logout API to clear server-side session
 * 2. Call NextAuth signOut() to clear client-side session
 * 3. Redirect to login page
 */

import { signOut } from 'next-auth/react';

export interface LogoutOptions {
  /**
   * Return URL to redirect to after login
   * If not provided, uses current pathname
   */
  returnUrl?: string;
  /**
   * Whether to show logout toast notification
   */
  showToast?: boolean;
  /**
   * Custom callback after logout completes
   */
  onComplete?: () => void;
  /**
   * Custom error handler
   */
  onError?: (error: unknown) => void;
}

/**
 * Perform complete logout: Backend API + NextAuth signOut
 * 
 * This follows the best practice pattern:
 * 1. Call backend logout API (clears server-side session and cookies)
 * 2. Call NextAuth signOut() (clears client-side session)
 * 3. Redirect to login page
 * 
 * @param logoutApiCall - Function that calls the logout API (e.g., logout mutation)
 * @param options - Logout options
 */
export async function performLogout(
  logoutApiCall: () => Promise<void>,
  options: LogoutOptions = {}
): Promise<void> {
  const {
    returnUrl,
    showToast = true,
    onComplete,
    onError,
  } = options;

  try {
    // Step 1: Call backend logout API
    // This clears server-side session, cookies, and Redux state
    await logoutApiCall();

    // Step 2: Call NextAuth signOut to clear client-side session
    // Use redirect: false to handle redirect manually
    try {
      await signOut({ redirect: false });
    } catch (signOutError) {
      // Even if signOut fails (e.g., CSRF warning), continue
      // The session will be cleared on next page load anyway
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Logout] NextAuth signOut had an error (continuing anyway):', signOutError);
      }
    }

    // Step 3: Build login URL with returnUrl and logout flag
    const currentPath = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const encodedReturnUrl = encodeURIComponent(currentPath);
    const loginUrl = `/login?r=${encodedReturnUrl}&logout=true`;

    // Step 4: Show toast notification if enabled
    if (showToast && typeof window !== 'undefined') {
      try {
        const toastEvent = new CustomEvent('auth:logout', {
          detail: {
            message: 'شما از حساب کاربری خود خارج شدید',
            type: 'info',
          },
        });
        window.dispatchEvent(toastEvent);
      } catch {
        // Toast event dispatch failed - continue anyway
      }
    }

    // Step 5: Call onComplete callback if provided
    if (onComplete) {
      onComplete();
    }

    // Step 6: Redirect to login page
    // Use window.location.href for full page reload to ensure complete state reset
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl;
    }
  } catch (error) {
    // Error handling: Even if backend logout fails, still try to clear NextAuth session
    console.error('[Logout] Logout process failed:', error);

    try {
      // Try to clear NextAuth session anyway
      await signOut({ redirect: false });
    } catch (signOutError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Logout] NextAuth signOut had an error (continuing anyway):', signOutError);
      }
    }

    // Call error handler if provided
    if (onError) {
      onError(error);
    } else {
      // Default: Redirect to login page anyway for security
      const currentPath = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
      const encodedReturnUrl = encodeURIComponent(currentPath);
      if (typeof window !== 'undefined') {
        window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
      }
    }
  }
}

