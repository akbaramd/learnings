/**
 * Client-side CSRF token helper
 * Reads the _csrf cookie (not HttpOnly, accessible via JavaScript)
 */

export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';').map(c => c.trim());
  const csrfCookie = cookies.find(c => c.startsWith('_csrf='));
  
  if (!csrfCookie) return null;
  
  // Extract value after '='
  const value = csrfCookie.substring(6); // '_csrf='.length = 6
  
  // Get the raw value (before .signature)
  const parts = value.split('.');
  return parts[0] || null;
}

/**
 * For RTK Query: get CSRF token for headers
 */
export function getCsrfHeader(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { 'x-csrf-token': token } : {};
}

