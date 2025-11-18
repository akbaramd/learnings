/**
 * Authentication Utility Functions
 * 
 * Provides helper functions for authentication-related operations
 * such as logout, redirect, and cookie management.
 */

/**
 * Clear all user-related data from localStorage
 * 
 * IMPORTANT: This does NOT clear:
 * - device_id: Required for session management (must persist across logout)
 * - theme: User preference (should persist)
 * 
 * This DOES clear:
 * - client_info: Cached IP address and user agent (user-specific)
 * - Any other user-specific data
 */
function clearUserDataFromLocalStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToPreserve = ['device_id', 'theme']; // Keys that should NOT be cleared
    
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Remove all keys except preserved ones
    keys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[auth-utils] Cleared user data from localStorage', {
        preservedKeys: keysToPreserve,
        clearedKeys: keys.filter(k => !keysToPreserve.includes(k)),
      });
    }
  } catch (error) {
    console.error('[auth-utils] Error clearing localStorage:', error);
  }
}

/**
 * Clear all data from sessionStorage
 * 
 * sessionStorage is session-specific and should be completely cleared on logout
 */
function clearSessionStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth-utils] Cleared all data from sessionStorage');
    }
  } catch (error) {
    console.error('[auth-utils] Error clearing sessionStorage:', error);
  }
}

/**
 * Clear NextAuth session by calling signOut
 * This must be called before redirecting to prevent redirect loops
 * 
 * @returns Promise that resolves when signOut completes
 */
async function clearNextAuthSession(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Dynamically import signOut to avoid SSR issues
    const { signOut } = await import('next-auth/react');
    
    // Call signOut with redirect: false to prevent automatic redirect
    // We'll handle redirect manually after clearing everything
    await signOut({ redirect: false });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[auth-utils] NextAuth session cleared');
    }
  } catch (error) {
    // If signOut fails, log but continue with logout process
    // This ensures logout still works even if NextAuth fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('[auth-utils] Failed to clear NextAuth session, continuing with logout:', error);
    }
  }
}

/**
 * Perform a complete logout and redirect to login page
 * 
 * This function performs a complete logout:
 * 1. Clears NextAuth session (prevents redirect loops)
 * 2. Clears Redux state (should be called after dispatch)
 * 3. Clears localStorage (except device_id and theme)
 * 4. Clears sessionStorage (all data)
 * 5. Calls logout API to clear server-side cookies
 * 6. Shows toast notification (optional)
 * 7. Redirects to login page with returnUrl and logout flag
 * 
 * IMPORTANT: This uses window.location.href for full page reload
 * to ensure all state is cleared and no stale data remains.
 * 
 * @param returnUrl - Optional URL to return to after login (default: current pathname)
 * @param showToast - Whether to show toast notification before redirect (default: true)
 */
export async function performLogoutAndRedirect(
  returnUrl?: string,
  showToast: boolean = true
): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('[auth-utils] Performing complete logout and redirect...', {
      returnUrl: returnUrl || (typeof window !== 'undefined' ? window.location.pathname : ''),
      showToast,
    });
  }

  try {
    // Get current pathname as returnUrl if not provided
    const currentPath = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const encodedReturnUrl = encodeURIComponent(currentPath);

    // Step 1: Clear NextAuth session FIRST to prevent redirect loops
    // This ensures NextAuth doesn't think user is still authenticated
    await clearNextAuthSession();

    // Step 2: Clear localStorage (except device_id and theme)
    clearUserDataFromLocalStorage();

    // Step 3: Clear sessionStorage (all data)
    clearSessionStorage();

    // Step 3: Show toast notification (if enabled)
    // Note: We can't use hooks in utility functions, so we dispatch a custom event
    // Components listening to this event can show toast notifications
    if (showToast && typeof window !== 'undefined') {
      try {
        // Dispatch custom event for toast notification
        // Components can listen to this event and show toast using useToast hook
        const toastEvent = new CustomEvent('auth:logout', {
          detail: {
            message: 'شما از حساب کاربری خود خارج شدید',
            type: 'info',
          },
        });
        window.dispatchEvent(toastEvent);
        
        if (isDev) {
          console.log('[auth-utils] Dispatched logout event for toast notification');
        }
      } catch {
        // Event dispatch failed - continue anyway
        if (isDev) {
          console.log('[auth-utils] Failed to dispatch toast event, continuing without toast');
        }
      }
    }

    // Step 4: Call logout API to clear server-side cookies
    // This ensures cookies are properly cleared even if they're httpOnly
    try {
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (isDev) {
        console.log('[auth-utils] Logout API response:', {
          status: logoutResponse.status,
          ok: logoutResponse.ok,
        });
      }
    } catch (error) {
      // Even if logout API fails, we still redirect
      // Cookies might already be cleared or will be cleared on next request
      if (isDev) {
        console.warn('[auth-utils] Logout API call failed, proceeding with redirect anyway:', error);
      }
    }

    // Step 5: Use window.location.href for full page reload
    // This ensures:
    // 1. All JavaScript state is cleared
    // 2. All React state is reset
    // 3. All Redux state is reset
    // 4. No stale data remains in memory
    // 5. Browser cache is properly handled
    // Include logout=true flag to prevent redirect loops
    const loginUrl = `/login?r=${encodedReturnUrl}&logout=true`;
    
    if (isDev) {
      console.log('[auth-utils] Redirecting to login:', loginUrl);
    }

    // Full page reload ensures complete state reset
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl;
    }
  } catch (error) {
    // If everything fails, still try to redirect
    if (isDev) {
      console.error('[auth-utils] Error during logout, forcing redirect:', error);
    }
    
    const currentPath = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const encodedReturnUrl = encodeURIComponent(currentPath);
    
    if (typeof window !== 'undefined') {
      window.location.href = `/login?r=${encodedReturnUrl}&logout=true`;
    }
  }
}

/**
 * Check if current pathname is an auth page
 * Used to prevent infinite redirect loops
 */
export function isAuthPage(pathname: string): boolean {
  return pathname === '/login' || pathname === '/verify-otp';
}

/**
 * Check if current pathname is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  // Protected routes start with /dashboard, /profile, /bills, etc.
  // But not /login, /verify-otp, /public, /api
  if (pathname.startsWith('/api')) return false;
  if (pathname.startsWith('/public')) return false;
  if (isAuthPage(pathname)) return false;
  if (pathname === '/') return false; // Root is handled separately
  
  // All other routes are considered protected
  return true;
}

