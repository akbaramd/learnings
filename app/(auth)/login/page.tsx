'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearUser, setAccessToken, setAuthStatus } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { selectAccessToken, selectIsInitialized } from '@/src/store/auth/auth.selectors';
import { PiFingerprint } from 'react-icons/pi';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();

    const accessToken = useAppSelector(selectAccessToken);
    const isInitialized = useAppSelector(selectIsInitialized);
    const isAuthenticated = !!accessToken;
    const isReady = isInitialized;

    const searchParams = useSearchParams();
    const returnUrl = useMemo(() => {
        const r = searchParams.get('r');
        if (!r) return null;

        let decodedReturnUrl = '';
        try {
            decodedReturnUrl = decodeURIComponent(r);
        } catch (error) {
            console.warn('[Login] Failed to decode returnUrl:', r, error);
            decodedReturnUrl = r;
        }

        if (decodedReturnUrl && decodedReturnUrl.startsWith('/') && !decodedReturnUrl.startsWith('//') && !decodedReturnUrl.startsWith('/http')) {
            return decodedReturnUrl;
        }
        return null;
    }, [searchParams]);

    const isLogoutFlow = searchParams.get('logout') === 'true';

    useEffect(() => {
        if (!isReady) return;

        if (isLogoutFlow) {
            dispatch(clearUser());
            dispatch(setAccessToken(null));
            dispatch(setAuthStatus('anonymous'));
            return;
        }

        if (isAuthenticated) {
            const redirectTo = returnUrl || '/dashboard';
            router.replace(redirectTo);
        }
    }, [isAuthenticated, isReady, isLogoutFlow, returnUrl, router, dispatch]);

    return (
        <div
            className="min-h-screen transition-colors duration-300 flex flex-col px-4 pt-16 pb-8 sm:px-6 lg:px-8 sm:pt-20 lg:pt-24"
            dir="rtl"
        >
            <div className="flex items-center justify-center flex-1 min-h-0">
                <div className="w-full max-w-sm sm:max-w-md space-y-6">
                    {/* Branding Header */}
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20">
                            <span className="text-2xl">🏢</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                            سامانه خدمات رفاهی
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            نظام مهندسی ساختمان آذربایجان غربی
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="relative w-full max-w-sm sm:max-w-md animate-slide-up">
                        <div className="backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border transition-all duration-300 bg-white/90 border-slate-200/60 dark:bg-slate-900/80 dark:border-slate-700/60">

                            <div className="text-center mb-8">
                                <h2 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                                    ورود به حساب کاربری
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    با دژبان وارد شوید
                                </p>
                            </div>

                            {/* OAUTH PRIMARY BUTTON - MOVED TO TOP */}
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = '/api/oauth/request';
                                }}
                                className="w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-300 bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 dark:bg-emerald-500 dark:text-slate-900 dark:hover:bg-emerald-400 active:scale-[0.98] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <PiFingerprint className="w-6 h-6" />
                                <span className="font-bold text-base tracking-wide">ورود امن با دژبان</span>
                            </button>

                            <p className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500 leading-relaxed">
                                اگر پس از ورود با دژبان به برنامه‌های رفاهی هدایت نشدید، به این صفحه برگردید و دوباره روی دکمه دژبان کلیک کنید.
                            </p>

                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-500">
                                با ورود به سامانه، شما <a href="#" className="text-emerald-600 hover:underline dark:text-emerald-400">قوانین و مقررات</a> را می‌پذیرید.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.4s ease-out; }
      `}</style>
        </div>
    );
}
