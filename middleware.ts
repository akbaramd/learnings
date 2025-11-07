import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle route protection and Telegram bot access
 * 
 * Key features:
 * - Allows public routes (/public/*) without authentication
 * - Allows Telegram bot to access pages for preview generation
 * - Protects authenticated routes
 * - Bypasses API routes, static assets, and OG image generation
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's a Telegram bot or other social media crawler
  const isTelegramBot = userAgent.includes('TelegramBot') || 
                       userAgent.includes('Telegram') ||
                       userAgent.includes('facebookexternalhit') ||
                       userAgent.includes('TwitterBot') ||
                       userAgent.includes('LinkedInBot') ||
                       userAgent.includes('WhatsApp') ||
                       userAgent.includes('Slackbot');
  
  // Always allow public routes (no auth required)
  if (pathname.startsWith('/public/')) {
    // For Telegram bot, ensure proper headers
    if (isTelegramBot) {
      const response = NextResponse.next();
      // Remove X-Frame-Options for Telegram preview (they need to fetch the page)
      response.headers.delete('X-Frame-Options');
      // Ensure proper content type
      response.headers.set('Content-Type', 'text/html; charset=utf-8');
      return response;
    }
    return NextResponse.next();
  }
  
  // Always bypass API routes, static assets, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/og-image')
  ) {
    return NextResponse.next();
  }
  
  // Allow Telegram bot to access any page for preview (even protected ones)
  // This is safe because they only read HTML, not execute actions
  if (isTelegramBot) {
    const response = NextResponse.next();
    response.headers.delete('X-Frame-Options');
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
    return response;
  }
  
  // Check for auth cookies
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  
  // Protected routes - require authentication
  const protectedPaths = [
    '/dashboard',
    '/bills',
    '/profile',
    '/wallet',
    '/notifications',
    '/surveys', // Protected surveys (not /public/surveys)
    '/tours',
    '/facilities',
    '/admin',
  ];
  
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path) && !pathname.startsWith('/public')
  );
  
  if (isProtectedPath) {
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('r', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/verify-otp') && (accessToken || refreshToken)) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next|favicon\\.ico).*)',
  ],
};

