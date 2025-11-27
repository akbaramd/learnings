'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import OtpField from '@/src/components/forms/OtpField';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/hooks/useToast';
import { selectChallengeId, selectMaskedPhone, selectNationalCode, selectAuthStatus, setChallengeId, setMaskedPhoneNumber, setNationalCode, setAuthStatus, clearError, setAccessToken } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { useDispatch } from 'react-redux';
import { signIn, useSession, getSession } from 'next-auth/react';
import { getDeviceId, getUserAgent } from '@/src/lib/deviceInfo';

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
  
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<UiStatus>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
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
  
  // محاسبه وضعیت
  const isLoading = isResendingOtp || isVerifyingOtp;
  const error = verifyError;


  // Show error from mutations
  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setStatus('invalid');
        const errorMessage = error && typeof error === 'object' && 'data' in error 
          ? (error as { data?: { errors?: string[] } }).data?.errors?.[0] || 'خطا در عملیات'
          : 'خطا در عملیات';
        setErrorText(errorMessage);
        setTouched(true);
      }, 0);
    }
  }, [error]);

  // Note: NextAuth session check will be handled by middleware or protected layout
  // We don't need to check authentication here anymore

  // Redirect if no challengeId or nationalCode (should come from login)
  useEffect(() => {
    // Redirect to login if we don't have the required data for OTP verification
    // Only redirect if we're absolutely sure there's no challengeId or nationalCode
    // and we're not in any loading or OTP-related state
    if ((!challengeId || !nationalCode) && 
        authStatus !== 'otp-sent' && 
        authStatus !== 'loading' && 
        authStatus !== 'idle') {
      router.push('/login');
    } else {
      console.log('Not redirecting - challengeId and nationalCode exist or in valid state');
    }
  }, [challengeId, nationalCode, authStatus, router]);

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

  const explain = useCallback((code: string): string | null => {
    if (code.length !== 6) return 'کد باید دقیقاً ۶ رقم باشد.';
    return null;
  }, []);

  const fieldStatus = useMemo(() => {
    if (status === 'invalid') return 'danger';
    if (status === 'valid') return 'success';
    if (status === 'typing') return 'typing';
    return 'default';
  }, [status]);

  const canSubmit = otp.length === 6 && !isLoading && challengeId;

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
      setOtp('');
      setStatus('idle');
      setErrorText(null);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title above card */}
      <div className="mb-8 text-center">
        <h1 className="text-heading-1 text-emerald-700 dark:text-emerald-400 mb-2">
          سامانه خدمات رفاهی   
        </h1>
        <p className="text-caption text-gray-500 dark:text-gray-400">
          نظام مهندسی ساختمان آذربایجان غربی
        </p>
      </div>
      
      <Card
        variant="elevated"
        padding="md"
        radius="md"
        className="w-full"
      >
          <div className="mb-6 text-center">
            <h2 className="text-heading-3-alt text-neutral-900 dark:text-neutral-100">تأیید کد</h2>
            <p className="mt-1 text-body text-neutral-600 dark:text-neutral-400">
              کد ۶ رقمی ارسال شده به شماره تلفن خود را وارد کنید.
            </p>
            <div className="mt-3 p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg border border-neutral-200 dark:border-gray-600">
              <p className="text-body text-neutral-700 dark:text-neutral-300">
                <span className="text-label">شماره تلفن:</span>
                <span className="mr-2 font-mono text-base sm:ltr" dir="ltr">{maskedPhone || 'در حال بارگذاری...'}</span>
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
            
            const err = explain(otp);
            if (err) {
              setTouched(true);
              setStatus('invalid');
              setErrorText(err);
              return;
            }

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
                otp: otp,
                deviceId: deviceId || null,
                userAgent: userAgent || null,
                redirect: false, // Handle redirect manually
              });
              
              if (result?.error) {
                // Handle error from NextAuth
                const errorMessage = result.error === 'CredentialsSignin' 
                  ? 'کد تأیید نامعتبر است. لطفاً دوباره تلاش کنید.'
                  : result.error;
                
                console.log('[VerifyOtp] ⚠️ OTP verification failed:', {
                  error: result.error,
                  message: errorMessage,
                });
                
                // Update UI state
                setStatus('invalid');
                setErrorText(errorMessage);
                setTouched(true);
                
                // Show error toast
                showError('خطا در تأیید', errorMessage);
                
                // Clear OTP field to allow retry
                setOtp('');
                
                setVerifyError({ message: errorMessage });
                return; // Don't redirect
              }
              
              // Success - NextAuth session is now established
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
              }
            } catch (error: unknown) {
              // Handle network errors or exceptions
              setStatus('invalid');
              const errorMessage = error instanceof Error 
                ? error.message 
                : 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.';
              setErrorText(errorMessage);
              setTouched(true);
              showError('خطا', errorMessage);
              setVerifyError({ message: errorMessage });
            } finally {
              setIsVerifyingOtp(false);
            }
          }}
        >
          <div className="space-y-3">
            <OtpField
              name="otp"
              label="رمز یکبار مصرف"
              description={errorText ?? '۶ رقم دریافتی را وارد کنید. فقط کاراکترهای عددی پذیرفته می‌شود.'}
              length={6}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setStatus(v.length === 0 ? 'idle' : v.length < 6 ? 'typing' : 'valid');
                if (touched) setErrorText(explain(v));
              }}
              onComplete={(v) => {
                const err = explain(v);
                if (err) {
                  setStatus('invalid');
                  setErrorText(err);
                } else {
                  setStatus('valid');
                  // No toast - UI status change is enough
                }
              }}
              disabled={isLoading}
              variant="outline"
              size="md"
              status={fieldStatus}
              fullWidth
              numericOnly
              mask={false}
              autoFocus
              focusStrategy="start"
              showLabel={true}
              labelPosition="center"
            />
            
            {/* Timer and Resend button in a row */}
            <div className="flex items-center justify-between gap-3">
              {!canResend ? (
                <div className="flex items-center gap-2 text-caption text-neutral-500 dark:text-neutral-400">
                  <span>زمان باقی‌مانده:</span>
                  <span className="font-mono text-red-600 dark:text-red-400 sm:ltr" dir="ltr">{formatTime(timeLeft)}</span>
                </div>
              ) : null}
              
              {canResend && (
                <Button
                  type="button"
                  variant="subtle"
                  size="sm"
                  radius="xs"
                  loading={resendLoading}
                  loadingText="در حال ارسال..."
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="mr-0"
                >
                  ارسال مجدد کد
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="solid"
              size="md"
              radius="xs"
              block
              loading={isLoading}
              loadingText="در حال تأیید..."
              shimmer
              disabled={!canSubmit}
            >
              تأیید کد
            </Button>
            
            <Button
              type="button"
              variant="subtle"
              size="md"
              radius="xs"
              block
              onClick={() => router.push('/login')}
            >
              تغییر شماره ملی
            </Button>
          </div>
          
          {/* Info message about organization phone numbers at bottom */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <p className="text-caption text-blue-700 dark:text-blue-300 text-center">
              کد تأیید به شماره تلفن ثبت‌شده در سیستم سازمان ارسال شده است.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
