import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Server-Side Authentication Check
 * 
 * This middleware runs BEFORE pages are rendered and:
 * 1. Checks authentication status via cookies
 * 2. Redirects unauthenticated users from protected routes to /login
 * 3. Redirects authenticated users from auth pages to /dashboard
 * 4. Allows public routes without authentication
 * 
 * Flow:
 * Request → Middleware (server-side) → Page Render
 */

// Protected routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/bills',
  '/profile',
  '/wallet',
  '/notifications',
  '/surveys',
  '/tours',
  '/facilities',
  '/admin',
];

// Auth pages (login, verify-otp)
const authPaths = ['/login', '/verify-otp'];

// Public routes that don't require authentication
const publicPaths = ['/public'];

/**
 * Check if a path is protected
 */
function isProtectedPath(pathname: string): boolean {
  // Root path is considered protected
  if (pathname === '/') {
    return true;
  }

  // Check if path starts with any protected path
  return protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * Check if a path is an auth page
 */
function isAuthPath(pathname: string): boolean {
  return authPaths.some((path) => pathname === path);
}

/**
 * Check if a path is public
 */
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname.startsWith(path));
}

/**
 * Check if user has authentication cookies
 */
function hasAuthCookies(request: NextRequest): boolean {
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');

  // User is considered authenticated if they have accessToken or refreshToken
  return !!(accessToken?.value || refreshToken?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = hasAuthCookies(request);
  const searchParams = request.nextUrl.searchParams;
  const logoutParam = searchParams.get('logout') === 'true';

  // Allow API routes - they handle their own authentication
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Handle auth pages
  if (isAuthPath(pathname)) {
    console.log('isAuthPath', pathname);
    console.log('hasAuth', hasAuth);
    console.log('logoutParam', logoutParam);
    // If user is authenticated and NOT in logout flow, redirect to root (/) with returnUrl
    if (hasAuth && !logoutParam) {
      const returnUrl = searchParams.get('r');
      const url = request.nextUrl.clone();
      url.pathname = '/';
      if (returnUrl) {
        url.searchParams.set('r', returnUrl);
      }
      return NextResponse.redirect(url);
    }

    // Allow access to auth pages if:
    // 1. User is not authenticated, OR
    // 2. User is in logout flow (logout=true)
    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedPath(pathname)) {
    // If user is not authenticated, redirect to login
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('r', encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  }

  // For all other routes, allow access (they can handle their own auth if needed)
  return NextResponse.next();
}

/**
 * Configure which routes should run middleware
 * Middleware runs on all routes except:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon, etc.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

