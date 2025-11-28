'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectIsInitialized } from '@/src/store/auth/auth.selectors';
import { PiSpinner } from 'react-icons/pi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Responsibilities:
 * 1. Protects routes by checking authentication state
 * 2. Redirects to login if user is not authenticated
 * 3. Prevents flicker by showing loading state during initialization
 *
 * Flow:
 * 1. Wait for initialization to complete
 * 2. If accessToken exists → render children
 * 3. If no accessToken → redirect to /login
 *
 * Note: Refresh logic is handled by baseQueryWithReauth, not here
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useSelector(selectAccessToken);
  const isInitialized = useSelector(selectIsInitialized);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for initialization to complete
    if (!isInitialized) {
      return;
    }

    // If we have accessToken, user is authenticated
    if (accessToken) {
      setChecking(false);
      return;
    }

    // No accessToken - user is not authenticated, redirect to login
    const returnUrl = encodeURIComponent(pathname);
    router.replace(`/login?r=${returnUrl}`);
    setChecking(false);
  }, [accessToken, isInitialized, router, pathname]);

  // Show loading state while checking
  if (checking) {
    return (
      <div className="h-dvh mx-auto max-w-full sm:max-w-full md:max-w-[30rem] lg:max-w-[30rem] xl:max-w-[30rem] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <PiSpinner className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            در حال بررسی احراز هویت...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated - render children
  return <>{children}</>;
}

