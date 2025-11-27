'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { PiSpinner } from "react-icons/pi";
import { useSelector } from 'react-redux';
import { selectAccessToken, selectIsInitialized, selectRefreshTokenChecked } from '@/src/store/auth/auth.selectors';
import { isAuthPage } from '@/src/lib/auth-utils';

/**
 * Safe redirect URL resolver
 * Only accepts internal paths starting with / to prevent open redirect attacks
 */
function safeResolveReturnUrl(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  
  try {
    const decoded = decodeURIComponent(returnUrl);
    // Only internal paths are allowed (prevent open redirect)
    if (decoded && decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.startsWith('/http')) {
      return decoded;
    }
  } catch (error) {
    console.warn('[Home] Failed to decode returnUrl:', returnUrl, error);
  }
  
  return null;
}

// Memoize HomeContent to prevent unnecessary re-renders
const HomeContent = React.memo(function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useSelector(selectAccessToken);
  const isInitialized = useSelector(selectIsInitialized);
  const refreshTokenChecked = useSelector(selectRefreshTokenChecked);
  
  // Use Redux state instead of NextAuth session
  // - accessToken: null means not authenticated
  // - isInitialized: true means auth check is complete
  // - refreshTokenChecked: true means refresh was attempted and failed
  
  const isAuthenticated = !!accessToken;
  const isReady = isInitialized; // Auth check is complete when initialized
  
  // Don't redirect if we're already on an auth page (prevent infinite loop)
  const isOnAuthPage = isAuthPage(pathname);
  
  // Only handle redirects if we're on the root route (/)
  // This page should only be active on root route
  const isRootRoute = pathname === '/';
  
  // Scenario: isReady = true && isAuthenticated = false
  // This means: NextAuth finished checking session, but user is NOT authenticated
  // This is a VALID state - user is logged out or never logged in
  // Action: Redirect to login page (already handled in useEffect below)
  
  const [messageIndex, setMessageIndex] = useState(0);
  const redirectInitiatedRef = useRef(false);
  const lastLoggedStateRef = useRef<{ isReady: boolean; isAuthenticated: boolean } | null>(null);

  // Different messages based on auth status
  const authenticatedMessages = useMemo(() => [
    "در حال انتقال به داشبورد...",
    "در حال بارگذاری اطلاعات...",
    "لطفاً صبر کنید...",
  ], []);

  const notAuthenticatedMessages = useMemo(() => [
    "در حال انتقال به صفحه ورود...",
    "لطفاً صبر کنید...",
    "در حال آماده‌سازی...",
  ], []);

  // Determine which messages to use
  const loadingMessages = useMemo(() => {
    return isReady && isAuthenticated 
      ? authenticatedMessages 
      : notAuthenticatedMessages;
  }, [isReady, isAuthenticated, authenticatedMessages, notAuthenticatedMessages]);

  // Log loading messages state changes (prevents duplicate logs from Strict Mode)
  useEffect(() => {
    const currentState = { isReady, isAuthenticated };
    const lastState = lastLoggedStateRef.current;
    
    if (!lastState || lastState.isReady !== isReady || lastState.isAuthenticated !== isAuthenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Home] Loading messages:', currentState);
      }
      lastLoggedStateRef.current = currentState;
    }
  }, [isReady, isAuthenticated]);

  // Calculate current message based on state
  const displayMessage = useMemo(() => {
    if (!isReady) {
      return "در حال بررسی وضعیت...";
    }
    // Get message from loadingMessages array based on messageIndex
    return loadingMessages[messageIndex] || loadingMessages[0];
  }, [isReady, loadingMessages, messageIndex]);

  // NextAuth handles initialization automatically - no need to call init

  useEffect(() => {
    // Cycle through loading messages only if ready
    if (!isReady) {
      return;
    }

    // Use setTimeout to avoid synchronous setState
    const timeoutId = setTimeout(() => {
      setMessageIndex(0);
    }, 0);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        const nextIndex = (prev + 1) % loadingMessages.length;
        return nextIndex;
      });
    }, 1000); // Slower interval for better UX

    return () => {
      clearTimeout(timeoutId);
      clearInterval(messageInterval);
    };
  }, [isReady, loadingMessages]);

  // Update status ref whenever auth state changes
  const lastAuthStateRef = useRef<{ isReady: boolean; isAuthenticated: boolean } | null>(null);
  useEffect(() => {
    const currentState = { isReady, isAuthenticated };
    
    // Only log when state actually changes (prevents duplicate logs from Strict Mode)
    if (process.env.NODE_ENV === 'development') {
      const lastState = lastAuthStateRef.current;
      if (!lastState || lastState.isReady !== isReady || lastState.isAuthenticated !== isAuthenticated) {
        console.log('[Home] Auth state changed:', { 
          isReady, 
          isAuthenticated,
          hasAccessToken: !!accessToken,
          refreshTokenChecked
        });
        lastAuthStateRef.current = currentState;
      }
    }
  }, [isReady, isAuthenticated, accessToken, refreshTokenChecked]);

  // Handle redirect based on auth status
  useEffect(() => {
    // Only handle redirects if we're on the root route (/)
    // This prevents redirects when navigating to other pages
    if (!isRootRoute) {
      return;
    }

    // Don't redirect if we're on an auth page (prevent infinite loop)
    if (isOnAuthPage) {
      return;
    }

    // Wait for auth to be ready (initialization complete)
    if (!isReady || redirectInitiatedRef.current) {
      return;
    }

    // At this point: isReady = true (auth check is complete)
    // Two possible scenarios:
    // 1. isAuthenticated = true → User is logged in → Redirect to dashboard
    // 2. isAuthenticated = false → User is NOT logged in → Redirect to login
    // Both scenarios are VALID and handled correctly below

    if (process.env.NODE_ENV === 'development') {
      console.log('[Home] Auth is ready, preparing redirect...', { 
        isReady, 
        isAuthenticated,
        hasAccessToken: !!accessToken,
        refreshTokenChecked,
        pathname,
        isOnAuthPage,
        isRootRoute
      });
    }

    // Small delay to show loading message before redirect
    const redirectTimeout = setTimeout(() => {
      // Double-check: only redirect if we're still on root route
      if (!isRootRoute || isOnAuthPage) {
        return;
      }

      // Get return URL from query params
      const returnUrl = searchParams.get('r');
      const safeReturnUrl = safeResolveReturnUrl(returnUrl);

      if (isAuthenticated) {
        // Scenario 1: User is authenticated (isReady = true, isAuthenticated = true)
        // Action: Redirect to returnUrl or dashboard
        redirectInitiatedRef.current = true;
        const redirectTo = safeReturnUrl || '/dashboard';
        if (process.env.NODE_ENV === 'development') {
          console.log('[Home] ✅ User authenticated, redirecting to:', redirectTo);
        }
        router.replace(redirectTo); // Use replace instead of push to prevent back button issues
      } else {
        // Scenario 2: User is NOT authenticated (isReady = true, isAuthenticated = false)
        // This is a VALID state - user is logged out or never logged in
        // Action: Redirect to login page with returnUrl (if provided)
        redirectInitiatedRef.current = true;
        const loginUrl = returnUrl 
          ? `/login?r=${encodeURIComponent(returnUrl)}`
          : '/login';
        if (process.env.NODE_ENV === 'development') {
          console.log('[Home] ⚠️ User not authenticated (logged out or never logged in), redirecting to:', loginUrl);
        }
        router.replace(loginUrl); // Use replace instead of push to prevent back button issues
      }
    }, 500); // Small delay to show message

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [isAuthenticated, isReady, searchParams, router, accessToken, refreshTokenChecked, pathname, isOnAuthPage, isRootRoute]);

  // Don't render anything if we're not on root route
  // This prevents the component from rendering on other routes
  if (!isRootRoute) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      <div className="flex flex-col items-center justify-center space-y-6 px-4">
        {/* Logo/Brand Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center">
              <span className="text-heading-1 text-white">س</span>
            </div>
          </div>
          
          <h1 className="text-heading-1 text-gray-900 dark:text-gray-100 text-center">
            سامانه خدمات رفاهی
          </h1>
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center space-y-4">
          <PiSpinner className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400" />
          
          {/* Loading Message */}
          <div className="flex flex-col items-center space-y-2">
            <p className="text-body text-gray-700 dark:text-gray-300 text-center min-h-[24px]">
              {displayMessage}
            </p>
            
            {/* Progress Dots */}
            <div className="flex items-center flex-row-reverse gap-2">
              {loadingMessages.map((_, index) => (
                <div
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === messageIndex
                      ? 'bg-emerald-600 dark:bg-emerald-400 w-6 h-2'
                      : 'bg-gray-300 dark:bg-gray-600 w-2 h-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-caption text-gray-500 dark:text-gray-400 text-center">
            © ۱۴۰۳ سامانه خدمات رفاهی
          </p>
        </div>
      </div>
    </div>
  );
});

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
          <div className="flex flex-col items-center justify-center space-y-6 px-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center">
                  <span className="text-heading-1 text-white">س</span>
                </div>
              </div>
              <h1 className="text-heading-1 text-gray-900 dark:text-gray-100 text-center">
                سامانه خدمات رفاهی
              </h1>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <PiSpinner className="h-12 w-12 animate-spin text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col items-center space-y-2">
                <p className="text-body text-gray-700 dark:text-gray-300 text-center min-h-[24px]">
                  در حال بارگذاری...
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

