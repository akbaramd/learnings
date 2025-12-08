'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from '@/src/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/hooks/useToast';
import { selectChallengeId, selectMaskedPhone, selectNationalCode, selectAuthStatus, setChallengeId, setMaskedPhoneNumber, setNationalCode, setAuthStatus, clearError, setAccessToken } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { useDispatch } from 'react-redux';
import { signIn, useSession, getSession } from 'next-auth/react';
import { getDeviceId, getUserAgent } from '@/src/lib/deviceInfo';
import { PiArrowRight, PiArrowClockwise, PiSun, PiMoon, PiCheck } from 'react-icons/pi';

type UiStatus = 'idle' | 'typing' | 'valid' | 'invalid';

/**
 * Safe redirect URL resolver
 * Only accepts internal paths starting with / to prevent open redirect attacks
 * If logout=true, always return dashboard
 * If no returnUrl, return dashboard
 */
function safeResolveReturnUrl(searchParams: URLSearchParams): string {
  const isLogoutFlow = searchParams.get('logout') === 'true';
  
  // If logout flow, always redirect to dashboard after login
  if (isLogoutFlow) {
    return '/dashboard';
  }
  
  const r = searchParams.get('r') ?? '';
  
  // CRITICAL: Decode returnUrl to handle query strings properly
  // Example: /surveys/123?step=2 gets encoded as %2Fsurveys%2F123%3Fstep%3D2
  // We need to decode it back to /surveys/123?step=2
  let decodedReturnUrl = '';
  try {
    decodedReturnUrl = r ? decodeURIComponent(r) : '';
  } catch (error) {
    console.warn('[VerifyOtp] Failed to decode returnUrl:', r, error);
    decodedReturnUrl = r; // Fallback to original if decode fails
  }
  
  // Only internal paths are allowed (prevent open redirect)
  if (decodedReturnUrl && decodedReturnUrl.startsWith('/') && !decodedReturnUrl.startsWith('//') && !decodedReturnUrl.startsWith('/http')) {
    return decodedReturnUrl;
  }
  
  // Default to dashboard if no returnUrl - don't redirect to root (/) to avoid redirect loop
  return '/dashboard';
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get return URL from query params and sanitize it
  const redirectTo = useMemo(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return safeResolveReturnUrl(searchParams);
  }, []);
  
  // دریافت challengeId، masked phone و national code از Redux store
  const challengeId = useAppSelector(selectChallengeId);
  const maskedPhone = useAppSelector(selectMaskedPhone);
  const nationalCode = useAppSelector(selectNationalCode);
  const authStatus = useAppSelector(selectAuthStatus);
  
  // NextAuth session for resend OTP
  const { data: session } = useSession();
  
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for OTP
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { success, error: showError } = useToast();
  
  // Protect against multiple redirects
  const navigatedRef = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);
  
  // State for NextAuth signIn
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [verifyError, setVerifyError] = useState<{ message?: string } | null>(null);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // محاسبه وضعیت
  const isLoading = isResendingOtp || isVerifyingOtp;
  const error = verifyError;


  // Note: NextAuth session check will be handled by middleware or protected layout
  // We don't need to check authentication here anymore

  // Redirect if no challengeId or nationalCode (should come from login)
  useEffect(() => {
    // Redirect to login if we don't have the required data for OTP verification
    // This ensures users can't access verify-otp page without going through login first
    if (!challengeId || !nationalCode) {
      console.log('Redirecting to login - missing challengeId or nationalCode');
      router.push('/login');
      return;
    }
  }, [challengeId, nationalCode, router]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setCanResend(true), 0);
    }
  }, [timeLeft]);

  // Format timer display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);


  const canSubmit = otp.every((digit) => digit !== '') && !isLoading && challengeId;

  // Helper functions for individual OTP inputs
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error
    setVerifyError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];

    pastedData.split('').forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);

    // Focus last filled input or last input
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  // Handle session update after resending OTP via NextAuth
  useEffect(() => {
    // Check if session has OTP data (from send-otp provider) after resend
    if (isResendingOtp && session?.user?.id === 'otp-sent' && session.challengeId) {
      // Store challengeId and maskedPhoneNumber in Redux
      dispatch(setChallengeId(session.challengeId));
      if (session.maskedPhoneNumber) {
        dispatch(setMaskedPhoneNumber(session.maskedPhoneNumber));
      }
      if (session.nationalCode) {
        dispatch(setNationalCode(session.nationalCode));
      }
      dispatch(setAuthStatus('otp-sent'));
      dispatch(clearError());

      // Reset UI state for resend
      setIsResendingOtp(false);
      setResendLoading(false);
      setTimeLeft(120); // Reset timer to 2 minutes
      setCanResend(false);
      setOtp(['', '', '', '', '', '']); // Reset OTP array
      success('کد جدید ارسال شد', `لطفاً کد جدید را بررسی کنید.`);
    }
  }, [session, isResendingOtp, dispatch, success]);

  // Handle resend OTP using NextAuth
  const handleResendOtp = useCallback(async () => {
    if (!canResend || resendLoading) return;
    
    setResendLoading(true);
    setIsResendingOtp(true);
    
    try {
      // اگر national code در store نباشد، به صفحه لاگین برگرد
      if (!nationalCode) {
        router.push('/login');
        return;
      }

      // Get device ID and user agent to send with request
      // CRITICAL: Use getDeviceId() to ensure SAME device ID as other requests
      // Device ID comes from localStorage (same source as baseApi.ts)
      const deviceId = getDeviceId();
      const userAgent = getUserAgent();
      
      // Use NextAuth signIn for resending OTP
      const result = await signIn('send-otp', {
        nationalCode: nationalCode,
        deviceId: deviceId || null,
        userAgent: userAgent || null,
        redirect: false,
      });
      
      if (result?.error) {
        // Handle error from NextAuth
        const errorMessage = result.error === 'CredentialsSignin'
          ? 'کد ملی نامعتبر است. لطفاً دوباره تلاش کنید.'
          : result.error;
        
        setIsResendingOtp(false);
        setResendLoading(false);
        showError('خطا', errorMessage);
      }
      // Success case is handled by useEffect watching session changes
      
    } catch (error: unknown) {
      setIsResendingOtp(false);
      setResendLoading(false);
      const errorMessage = error instanceof Error
        ? error.message
        : 'ارسال مجدد کد ناموفق بود.';
      showError('خطا', errorMessage);
    }
  }, [canResend, resendLoading, showError, nationalCode, router]);

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col px-4 pt-12 pb-6 sm:px-6 lg:px-8 sm:pt-16 lg:pt-20"
      dir="rtl"
    >
      {/* Centered Content */}
      <div className="flex items-center justify-center flex-1 min-h-0">
        <div className="w-full max-w-sm sm:max-w-md space-y-3">
          {/* Branding Header */}
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <span className="text-base">🔐</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              سامانه خدمات رفاهی
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              نظام مهندسی ساختمان آذربایجان غربی
            </p>
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
          </div>

          {/* OTP Card */}
          <div className="relative w-full animate-slide-up backdrop-blur-xl rounded-3xl p-6 shadow-2xl border transition-all duration-300 bg-white/80 border-slate-200/50 dark:bg-slate-800/50 dark:border-slate-700/50">

          {/* Back Button - Inside Card */}
          <div className="flex justify-start mb-4">
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
              aria-label="بازگشت به صفحه ورود"
            >
              <PiArrowRight className="w-4 h-4" />
              <span className="text-sm font-medium">بازگشت</span>
            </button>
          </div>
          {/* Title */}
          <div className="text-center mb-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                کد ۶ رقمی ارسال شده به شماره تلفن زیر را وارد کنید:
              </p>
              <p className="font-mono text-base font-semibold text-slate-900 dark:text-white" dir="ltr">
                {maskedPhone || 'در حال بارگذاری...'}
              </p>
            </div>
          </div>


        <form
          noValidate
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();

                    // Prevent multiple submissions
            if (isLoading || !challengeId) return;

            const otpCode = otp.join('');

            // Use NextAuth signIn with OTP provider
            try {
              setIsVerifyingOtp(true);
              setVerifyError(null);
              
              // Get device ID and user agent to send with request
              // CRITICAL: Use getDeviceId() to ensure SAME device ID as other requests
              // Device ID comes from localStorage (same source as baseApi.ts)
              // This ensures the SAME device ID is used across all authentication requests
              // Device ID is NEVER regenerated - always returns existing ID from localStorage
              const deviceId = getDeviceId();
              const userAgent = getUserAgent();
              
              const result = await signIn('otp', {
                challengeId: challengeId!,
                otp: otpCode,
                deviceId: deviceId || null,
                userAgent: userAgent || null,
                redirect: false, // Handle redirect manually
              });
              
              // Check for success first - if ok is true, proceed even if error exists
              if (result?.ok && !navigatedRef.current) {
                console.log('========================================');
                console.log('[VerifyOtp] ✅ OTP VERIFIED SUCCESSFULLY via NextAuth');
                console.log('[VerifyOtp] Redirect target:', redirectTo);
                console.log('========================================');
                
                success('ورود موفق', 'در حال انتقال...');
                
                // 🔥 CRITICAL: Get accessToken from NextAuth session and sync to Redux
                // This ensures ProtectedRoute and other components can access accessToken
                // We need to wait for NextAuth session to be fully updated
                try {
                  // Wait for NextAuth session to be updated (may take a moment)
                  // Try multiple times with increasing delays
                  let session = await getSession();
                  let accessToken = session?.accessToken || null;
                  
                  // If no accessToken yet, wait and retry
                  if (!accessToken) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    session = await getSession();
                    accessToken = session?.accessToken || null;
                  }
                  
                  // If still no accessToken, wait once more
                  if (!accessToken) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    session = await getSession();
                    accessToken = session?.accessToken || null;
                  }
                  
                  if (accessToken) {
                    // Sync accessToken to Redux for backward compatibility
                    dispatch(setAccessToken(accessToken));
                    dispatch(setAuthStatus('authenticated'));
                  
                  if (process.env.NODE_ENV === 'development') {
                      console.log('[VerifyOtp] ✅ accessToken synced to Redux from NextAuth session');
                    }
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.warn('[VerifyOtp] ⚠️ No accessToken in NextAuth session after verify - SilentRefreshProvider will handle it');
                  }
                    // Don't block redirect - SilentRefreshProvider will try to refresh on next page load
                  }
                } catch (error) {
                  console.error('[VerifyOtp] ❌ Failed to sync accessToken to Redux:', error);
                  // Don't block redirect - SilentRefreshProvider will handle it on next page load
                }
                
                // Redirect to target page
                // NextAuth session is now available with accessToken
                // Redux also has accessToken for backward compatibility
                navigatedRef.current = true;
                
                // Use router.replace instead of window.location.href for better Next.js navigation
                // But ensure we're redirecting to a valid route (not root /)
                const finalRedirectTo = redirectTo === '/' ? '/dashboard' : redirectTo;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[VerifyOtp] 🔄 Redirecting to:', finalRedirectTo);
                }
                
                router.replace(finalRedirectTo);
                return; // Exit early on success
              }
              
              // Only show error if result is not ok
              if (result?.error) {
                // Handle error from NextAuth
                const errorMessage = result.error === 'CredentialsSignin' 
                  ? 'کد تأیید نامعتبر است. لطفاً دوباره تلاش کنید.'
                  : result.error;
                
                console.log('[VerifyOtp] ⚠️ OTP verification failed:', {
                  error: result.error,
                  message: errorMessage,
                });
                
                // Show error toast
                showError('خطا در تأیید', errorMessage);

                // Clear OTP inputs to allow retry
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                
                setVerifyError({ message: errorMessage });
                return; // Don't redirect
              }
            } catch (error: unknown) {
              // Handle network errors or exceptions
              const errorMessage = error instanceof Error
                ? error.message
                : 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.';
              showError('خطا', errorMessage);
              setVerifyError({ message: errorMessage });
              setOtp(['', '', '', '', '', '']);
              inputRefs.current[0]?.focus();
            } finally {
              setIsVerifyingOtp(false);
            }
          }}
        >
          {/* OTP Input Boxes */}
          <div className="mb-4">
            <label className="block text-sm mb-3 text-center text-slate-700 dark:text-slate-300">
              رمز یکبار مصرف
            </label>

            <div className="flex justify-center gap-2 mb-4" dir="ltr">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-xl rounded-xl border-2 transition-all duration-200 bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white ${
                    digit ? 'border-emerald-600 dark:border-emerald-500' : ''
                  } ${
                    verifyError ? 'border-red-500 animate-shake' : ''
                  } ${
                    isVerifyingOtp ? 'opacity-50 cursor-not-allowed' : ''
                  } focus:outline-none`}
                  aria-label={`رقم ${index + 1}`}
                />
              ))}
            </div>

            {/* Error Message */}
            {verifyError && (
              <div className="text-center text-red-500 text-sm mb-4 animate-shake">
                {verifyError.message}
              </div>
            )}

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    timeLeft < 30 ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                  <p className={`text-sm ${
                    timeLeft < 30
                      ? 'text-red-500'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    زمان باقی‌مانده: <span className="font-mono">{formatTime(timeLeft)}</span>
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-200 ${
                    'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300'
                  } ${isResendingOtp ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <PiArrowClockwise className={`w-4 h-4 ${isResendingOtp ? 'animate-spin' : ''}`} />
                  <span>ارسال مجدد کد</span>
                </button>
              )}
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-center mb-4 text-slate-600 dark:text-slate-500">
            ۶ رقم دریافتی را وارد کنید. فقط کاراکترهای عددی پذیرفته می‌شود.
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl transition-all duration-200 mb-4 ${
              !canSubmit
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98]'
            }`}
          >
            {isVerifyingOtp ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال تایید...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <PiCheck className="w-5 h-5" />
                تایید کد
              </span>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-4 p-3 rounded-xl border bg-blue-50 border-blue-200/50 dark:bg-blue-500/10 dark:border-blue-500/20">
            <p className="text-xs text-center text-blue-600 dark:text-blue-400">
              اگر شماره تلفن نادرست است، با پشتیبانی تماس بگیرید.
            </p>
          </div>

        </form>
        </div>
        </div>
        </div>
      </div>

  );
}
