'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { PiSpinner } from "react-icons/pi";
import { useSession } from 'next-auth/react';

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && !!session;
  const isReady = status !== 'loading';
  const [messageIndex, setMessageIndex] = useState(0);
  const redirectInitiatedRef = useRef(false);

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

  // Handle redirect based on auth status
  useEffect(() => {
    // Wait for auth to be ready
    if (!isReady || redirectInitiatedRef.current) {
      console.log('[Home] Waiting for auth to be ready...', { isReady, redirectInitiated: redirectInitiatedRef.current });
      return;
    }

    console.log('[Home] Auth is ready, preparing redirect...', { isAuthenticated });

    // Small delay to show loading message before redirect
    const redirectTimeout = setTimeout(() => {
      // Get return URL from query params
      const returnUrl = searchParams.get('r');
      const safeReturnUrl = safeResolveReturnUrl(returnUrl);

      if (isAuthenticated) {
        // User is authenticated - redirect to returnUrl or dashboard
        redirectInitiatedRef.current = true;
        const redirectTo = safeReturnUrl || '/dashboard';
        console.log('[Home] ✅ User authenticated, redirecting to:', redirectTo);
        router.push(redirectTo);
      } else {
        // User is not authenticated - redirect to login with returnUrl
        redirectInitiatedRef.current = true;
        const loginUrl = returnUrl 
          ? `/login?r=${encodeURIComponent(returnUrl)}`
          : '/login';
        console.log('[Home] ❌ User not authenticated, redirecting to:', loginUrl);
        router.push(loginUrl);
      }
    }, 500); // Small delay to show message

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [isAuthenticated, isReady, searchParams, router]);

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
}

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

