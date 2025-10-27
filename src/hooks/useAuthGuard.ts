'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import { setAnonymous } from '@/src/store/auth/auth.slice';
import { useAuth } from '@/src/hooks/useAuth';
import { api } from '@/src/store/api/baseApi';
import { authApi } from '@/src/store/auth';
import { walletsApi } from '@/src/store/wallets';
import { billsApi } from '@/src/store/bills';
import { paymentsApi } from '@/src/store/payments';
import { notificationsApi } from '@/src/store/notifications';
import { discountsApi } from '@/src/store/discounts';

type AuthSyncEvent =
  | { type: 'AUTH_LOGOUT'; source?: string }
  | { type: 'AUTH_LOGIN'; payload?: unknown; source?: string };

export type UseAuthGuardOptions = {
  /** مسیرهای عمومی که نباید ریدایرکت شوند (دقیق یا prefix) */
  publicPaths?: string[];
  /** در mount: checkSession و در صورت نیاز getMe */
  autoInit?: boolean;
  /** همگام‌سازی بین‌تب (BroadcastChannel + storage fallback) */
  crossTab?: boolean;
  /** اگر احراز نشده بود و مسیر محافظت‌شده است → ریدایرکت به Login */
  autoRedirect?: boolean;
  /** نام کانال BroadcastChannel */
  channelName?: string;
};

const DEFAULTS: Required<UseAuthGuardOptions> = {
  publicPaths: ['/login', '/verify-otp', '/'],
  autoInit: true,
  crossTab: true,
  autoRedirect: true,
  channelName: 'auth-sync',
};

const STORAGE_KEY = '__auth_sync__';
const STORAGE_LOGOUT_VALUE = 'logout';

function emitStorageLogoutSignal(source: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, `${STORAGE_LOGOUT_VALUE}:${source}:${Date.now()}`);
  } catch {
    // ignore
  }
}

// شناسه یکتا برای این تب/نمونه (جهت جلوگیری از حلقه loop)
const instanceId = (() => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
})();

// Export notifyLogoutAllTabs for use in auth.queries.ts
export function notifyLogoutAllTabs(channelName = DEFAULTS.channelName): void {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(channelName);
      bc.postMessage({ type: 'AUTH_LOGOUT', source: instanceId } as AuthSyncEvent);
      bc.close();
    } else {
      emitStorageLogoutSignal(instanceId);
    }
  } catch {
    emitStorageLogoutSignal(instanceId);
  }
}

/**
 * useAuthGuard:
 * - init: checkSession (+getMe در صورت نیاز)
 * - guard: redirect در صفحات محافظت‌شده وقتی isAuthenticated=false
 * - cross-tab: شنود و ارسال AUTH_LOGOUT
 * - هندل خودکار نتیجهٔ موفق logout: انتشار رویداد و ریدایرکت
 */
export function useAuthGuard(opts?: UseAuthGuardOptions) {
  const options = { ...DEFAULTS, ...(opts || {}) };

  // لایهٔ داده/اکشن از useAuth (بدون side-effect ناوبری درون آن)
  const {
    // state
    isAuthenticated,
    isReady,
    authStatus,
    isSessionLoading,
    isSessionFetching,

    // mutations & lazies
    logout,                 // RTK mutation
    initializeAuth,         // checkSession + getMe
    // نتایج برای مشاهدهٔ outcome
    logoutResult,
  } = useAuth();

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  // ممانعت از لاگ‌اوت‌های پشت‌سرهم و Side-effect چندباره
  const redirectedRef = useRef(false);
  const logoutInFlightRef = useRef(false);
  const notifiedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Helper: Reset all RTK Query APIs and do hard redirect
  const performLogoutRedirect = useCallback((returnUrl: string) => {
    setIsRedirecting(true);
    
    // 1. Dispatch setAnonymous
    dispatch(setAnonymous());
    
    // 2. Reset all RTK Query APIs to cancel all pending requests
    dispatch(api.util.resetApiState());
    dispatch(authApi.util.resetApiState());
    dispatch(walletsApi.util.resetApiState());
    dispatch(billsApi.util.resetApiState());
    dispatch(paymentsApi.util.resetApiState());
    dispatch(notificationsApi.util.resetApiState());
    dispatch(discountsApi.util.resetApiState());
    
    // 3. Both soft and hard redirect
    router.replace(returnUrl);
    if (typeof window !== 'undefined') {
      // Hard redirect prevents UI flash
      window.location.replace(returnUrl);
    }
  }, [dispatch, router]);

  // مسیر عمومی؟
  const isPublic = useMemo(() => {
    const p = pathname || '/';
    return options.publicPaths.some((x) => p === x || p.startsWith(x + '/'));
  }, [pathname, options.publicPaths]);

  // ---- auto init ----
  useEffect(() => {
    if (!options.autoInit) return;
    void initializeAuth();
  }, [options.autoInit, initializeAuth]);

  // ---- cross-tab: listen external AUTH_LOGOUT ----
  useEffect(() => {
    if (!options.crossTab) return;

    let bc: BroadcastChannel | null = null;

    const handleLogoutSignal = (source?: string) => {
      // پیام خودم را نادیده بگیر - جلوگیری از حلقه
      if (source && source === instanceId) return;

      if (redirectedRef.current) return;
      redirectedRef.current = true;

      // ریدایرکت ایمن با returnUrl + reset RTK + hard redirect
      const ret = encodeURIComponent(pathname || '/');
      performLogoutRedirect(`/login?r=${ret}`);
    };

    // Preferred: BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(options.channelName);
        const bcHandler = (e: MessageEvent<AuthSyncEvent>) => {
          if (e.data?.type === 'AUTH_LOGOUT') handleLogoutSignal(e.data.source);
        };
        bc.addEventListener('message', bcHandler);

        return () => {
          bc?.removeEventListener('message', bcHandler);
          bc?.close();
        };
      }
    } catch {
      // fallback below
    }

    // Fallback: storage event
    const storageHandler = (e: StorageEvent) => {
      if (!e?.key || e.key !== STORAGE_KEY || !e.newValue) return;
      // value format: "logout:<source>:<ts>"
      const [flag, source] = e.newValue.split(':');
      if (flag === STORAGE_LOGOUT_VALUE) handleLogoutSignal(source);
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [options.crossTab, options.channelName, pathname, performLogoutRedirect]);

  // ---- guard: redirect در صفحات محافظت‌شده پس از آماده‌شدن سشن ----
  useEffect(() => {
    if (!options.autoRedirect) return;
    if (!isReady) return;          // صبر تا اولین چک سشن
    if (isPublic) return;          // صفحه عمومی

    if (!isAuthenticated) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      const ret = encodeURIComponent(pathname || '/');
      performLogoutRedirect(`/login?r=${ret}`);
    }
  }, [options.autoRedirect, isReady, isAuthenticated, isPublic, pathname, performLogoutRedirect]);

  // ---- واکنش خودکار به موفقیت logout: ارسال سیگنال به تمام تب‌ها + redirect تب جاری ----
  useEffect(() => {
    if (!logoutResult?.isSuccess) return;
    if (notifiedRef.current) return; // یک‌بار

    notifiedRef.current = true;

    // ارسال رویداد برای تب‌های دیگر با instanceId
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(options.channelName);
        bc.postMessage({ type: 'AUTH_LOGOUT', source: instanceId } as AuthSyncEvent);
        bc.close();
      } else {
        emitStorageLogoutSignal(instanceId);
      }
    } catch {
      emitStorageLogoutSignal(instanceId);
    }

    // تب جاری: تغییر state + redirect یک‌باره
    if (!redirectedRef.current) {
      redirectedRef.current = true;
      const ret = encodeURIComponent(pathname || '/');
      performLogoutRedirect(`/login?r=${ret}`);
    }
  }, [logoutResult?.isSuccess, options.channelName, pathname, performLogoutRedirect]);

  // --- API امن: یک‌بار لاگ‌اوت، بدون تکرار ---
  const requestLogoutOnce = async () => {
    if (logoutInFlightRef.current) return; // جلوگیری از کلیک دوباره/چندبار فراخوانی
    logoutInFlightRef.current = true;
    
    try {
      // logout is already an async handler that calls the mutation
      await logout();
      // اثراتِ پس از موفقیت در useEffect بالا انجام می‌شود
    } catch {
      // در خطای شبکه هم کاربر را محلی خارج کن و redirect امن
      if (!notifiedRef.current) {
        notifiedRef.current = true;
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel(options.channelName);
            bc.postMessage({ type: 'AUTH_LOGOUT', source: instanceId } as AuthSyncEvent);
            bc.close();
          } else {
            emitStorageLogoutSignal(instanceId);
          }
        } catch {
          emitStorageLogoutSignal(instanceId);
        }
      }
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        const ret = encodeURIComponent(pathname || '/');
        performLogoutRedirect(`/login?r=${ret}`);
      }
    } finally {
      logoutInFlightRef.current = false; // اجازهٔ تلاش دوباره بعد از اتمام چرخه
    }
  };

  return {
    // وضعیت جهت استفادهٔ UI در صورت نیاز
    isAuthenticated,
    isReady,
    authStatus,
    isSessionLoading,
    isSessionFetching,
    isRedirecting, // Flag indicating redirect in progress
    // API سطح UI
    requestLogout: requestLogoutOnce,
  };
}
