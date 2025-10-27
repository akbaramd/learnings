import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isProtectedPath(pathname: string): boolean {
  // مسیرهای محافظت‌شده را صریح مشخص کنید
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/bills') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/admin')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for Next.js internal routes and special requests
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/__nextjs') ||
    pathname.startsWith('/_') ||
    request.nextUrl.searchParams.has('_rsc') // Skip for Server Components Router Cache
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // جلوگیری از دسترسی صفحات Auth برای کاربر لاگین‌شده
  if ((pathname === '/login' || pathname === '/verify-otp') && (accessToken || refreshToken)) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  // حفاظت از صفحات حساس
  if (isProtectedPath(pathname)) {
    if (!accessToken && !refreshToken) {
      const url = new URL('/login', request.url);
      url.searchParams.set('r', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Runtime configuration - use experimental edge runtime
export const runtime = 'experimental-edge';

export const config = {
  // Match all routes except Next.js internals, API routes, and static files
  matcher: ['/((?!_next|__nextjs|_static|favicon.ico|api).*)'],
};

