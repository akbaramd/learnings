'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import OtpField from '@/src/components/forms/OtpField';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/hooks/useToast';
import { useSendOtpMutation, useVerifyOtpMutation, selectChallengeId, selectMaskedPhone, selectNationalCode, selectAuthStatus } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { useAuth } from '@/src/hooks/useAuth';

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
  
  // Default to dashboard if no returnUrl
  return '/dashboard';
}

export default function VerifyOtpPage() {
  const router = useRouter();
  
  // Use useAuth hook for authentication state
  const { isAuthenticated, isReady } = useAuth();
  
  // Get return URL from query params and sanitize it
  const redirectTo = useMemo(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return safeResolveReturnUrl(searchParams);
  }, []);
  
  // استفاده مستقیم از RTK Query hooks
  const [sendOtpMutation, { isLoading: isSendingOtp, error: sendError }] = useSendOtpMutation();
  const [verifyOtpMutation, { isLoading: isVerifyingOtp, error: verifyError }] = useVerifyOtpMutation();
  
  // دریافت challengeId، masked phone و national code از Redux store
  const challengeId = useAppSelector(selectChallengeId);
  const maskedPhone = useAppSelector(selectMaskedPhone);
  const nationalCode = useAppSelector(selectNationalCode);
  const authStatus = useAppSelector(selectAuthStatus);
  
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
  
  // محاسبه وضعیت
  const isLoading = isSendingOtp || isVerifyingOtp;
  const error = sendError || verifyError;


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

  // Check if user is authenticated and redirect to dashboard
  // This handles the case where user is already authenticated (e.g., from another tab)
  // NOTE: This useEffect is now secondary - the main redirect happens in onSubmit after cookie verification
  useEffect(() => {
    // Wait for auth to be ready
    if (!isReady) {
      return;
    }

    // If user is authenticated, redirect to dashboard or returnUrl
    // CRITICAL: Only redirect if authStatus is authenticated (not just isAuthenticated)
    // This ensures cookies are valid and Redux state is synced
    // BUT: Only redirect if we haven't already navigated (prevent double redirect)
    // AND: Only redirect if we're not in the middle of OTP verification (navigatedRef prevents this)
    if (isAuthenticated && authStatus === 'authenticated' && !navigatedRef.current) {
      console.log('[VerifyOtp] 🔄 useEffect triggered - User authenticated');
      console.log('[VerifyOtp] useEffect state:', {
        isAuthenticated,
      authStatus,
        isReady,
        navigatedRef: navigatedRef.current,
        redirectTo,
      });
      console.log('[VerifyOtp] Verifying cookies before redirect (from useEffect)...');
      
      // Verify cookies are set before redirecting (same logic as onSubmit)
      setTimeout(async () => {
        try {
          console.log('[VerifyOtp] useEffect: Calling /api/auth/me...');
          const verifyRes = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          
          console.log('[VerifyOtp] useEffect: /api/auth/me response status:', verifyRes.status);
          
          if (verifyRes.status === 200 && !navigatedRef.current) {
            console.log('[VerifyOtp] ✅ useEffect: Cookies verified! Redirecting to:', redirectTo);
            navigatedRef.current = true;
            console.log('[VerifyOtp] 🚀 useEffect: REDIRECTING to:', redirectTo);
            window.location.href = redirectTo;
          } else {
            console.log('[VerifyOtp] ⚠️ useEffect: Cannot redirect -', {
              status: verifyRes.status,
              navigatedRef: navigatedRef.current,
            });
          }
        } catch (error) {
          console.error('[VerifyOtp] ❌ useEffect: Error verifying cookies:', error);
        }
      }, 100); // Small delay to ensure cookies are set
    } else {
      console.log('[VerifyOtp] useEffect: Not redirecting -', {
        isAuthenticated,
        authStatus,
        isReady,
        navigatedRef: navigatedRef.current,
        reason: !isAuthenticated ? 'not authenticated' : 
                authStatus !== 'authenticated' ? 'authStatus not authenticated' :
                navigatedRef.current ? 'already navigated' : 'unknown',
      });
    }
  }, [isAuthenticated, isReady, authStatus, redirectTo]);

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

  // Handle resend OTP
  const handleResendOtp = useCallback(async () => {
    if (!canResend || resendLoading) return;
    
    setResendLoading(true);
    
    try {
      // اگر national code در store نباشد، به صفحه لاگین برگرد
      if (!nationalCode) {
        router.push('/login');
        return;
      }

      // استفاده مستقیم از mutation hook با national code ذخیره شده
      await sendOtpMutation({
        nationalCode: nationalCode,
        purpose: 'login',
        deviceId: 'web-browser'
      }).unwrap();

      // Reset UI state for resend
      setResendLoading(false);
      setTimeLeft(120); // Reset timer to 2 minutes
      setCanResend(false);
      setOtp('');
      setStatus('idle');
      setErrorText(null);
      // Only show success toast for successful resend
      success('کد جدید ارسال شد', `لطفاً کد جدید را بررسی کنید.`);
      
    } catch (error: unknown) {
      setResendLoading(false);
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error as { data?: { message?: string } }).data?.message || 'ارسال مجدد کد ناموفق بود.'
        : 'ارسال مجدد کد ناموفق بود.';
      showError('خطا', errorMessage);
    }
  }, [canResend, resendLoading, success, showError, sendOtpMutation, nationalCode, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title above card */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
          سامانه خدمات رفاهی   
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-500">
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
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">تأیید کد</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              کد ۶ رقمی ارسال شده به شماره تلفن خود را وارد کنید.
            </p>
            <div className="mt-3 p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg border border-neutral-200 dark:border-gray-600">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-medium">شماره تلفن:</span>
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

            // استفاده مستقیم از mutation hook
            try {
              const result = await verifyOtpMutation({
                challengeId: challengeId!,
                otpCode: otp
              }).unwrap();
              
              // Redirect after successful verification
              // CRITICAL: Wait for cookies to be set and verified before redirecting
              // This prevents redirect loops where ProtectedLayout sees 401 before cookies arrive
              if (result?.isSuccess && !navigatedRef.current) {
                console.log('========================================');
                console.log('[VerifyOtp] ✅ OTP VERIFIED SUCCESSFULLY');
                console.log('[VerifyOtp] Result:', JSON.stringify(result, null, 2));
                console.log('[VerifyOtp] Current authStatus:', authStatus);
                console.log('[VerifyOtp] Current isAuthenticated:', isAuthenticated);
                console.log('[VerifyOtp] Current isReady:', isReady);
                console.log('[VerifyOtp] Redirect target:', redirectTo);
                console.log('[VerifyOtp] navigatedRef.current:', navigatedRef.current);
                console.log('========================================');
                
                success('ورود موفق', 'در حال انتقال...');
                
                // Set flag in sessionStorage so ProtectedLayout knows we just verified
                // This prevents ProtectedLayout from redirecting before cookies are available
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('justVerifiedOtp', 'true');
                  console.log('[VerifyOtp] Set justVerifiedOtp flag in sessionStorage');
                }
                
                // CRITICAL: Wait a bit for cookies to be set server-side
                // Then verify cookies are valid by calling /api/auth/me
                // Only redirect if /api/auth/me returns 200 (cookies are valid)
                // This prevents redirect loop where ProtectedLayout sees 401
                console.log('[VerifyOtp] Waiting 300ms for cookies to be set server-side...');
                console.log('[VerifyOtp] NOTE: httpOnly cookies cannot be read via document.cookie - this is normal');
                console.log('[VerifyOtp] Cookies will be sent automatically with fetch requests if set correctly');
                
                setTimeout(async () => {
                  try {
                    console.log('[VerifyOtp] ⏳ Verifying cookies by calling /api/auth/me...');
                    console.log('[VerifyOtp] Using credentials: include to send cookies automatically');
                    
                    const verifyRes = await fetch('/api/auth/me', {
                      method: 'GET',
                      credentials: 'include', // CRITICAL: This sends cookies automatically
                    });
                    
                    console.log('[VerifyOtp] /api/auth/me response status:', verifyRes.status);
                    console.log('[VerifyOtp] /api/auth/me response headers:', {
                      'x-me-prefetched': verifyRes.headers.get('x-me-prefetched'),
                      'x-token-refreshed': verifyRes.headers.get('x-token-refreshed'),
                    });
                    
                    // NOTE: httpOnly cookies cannot be read via document.cookie
                    // This is a security feature - we can only verify they work by checking /api/auth/me response
                    // If /api/auth/me returns 200, cookies are working correctly
                    if (typeof document !== 'undefined') {
                      const cookies = document.cookie.split('; ');
                      console.log('[VerifyOtp] Browser cookies (NOTE: httpOnly cookies are NOT visible here):', {
                        visibleCookies: cookies,
                        allCookiesCount: cookies.length,
                        note: 'httpOnly cookies (accessToken, refreshToken) are NOT visible in document.cookie - this is normal and secure',
                      });
                    }
                    
                    if (verifyRes.status === 200) {
                      console.log('[VerifyOtp] ✅ Cookies verified! Status 200');
                      console.log('[VerifyOtp] Setting navigatedRef.current = true');
                      navigatedRef.current = true;
                      
                      // Clear the flag before redirect
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('justVerifiedOtp');
                        console.log('[VerifyOtp] Cleared justVerifiedOtp flag from sessionStorage');
                      }
                      
                      console.log('[VerifyOtp] 🚀 REDIRECTING to:', redirectTo);
                      console.log('[VerifyOtp] Using window.location.href for full page reload');
                      // Use window.location.href for full page reload to ensure cookies are refreshed
                      window.location.href = redirectTo;
                    } else {
                      console.warn('[VerifyOtp] ⚠️ Cookies not valid yet (status:', verifyRes.status, ')');
                      console.warn('[VerifyOtp] Waiting 500ms more and retrying...');
                      
                      // Wait another 500ms and try again (max 3 retries)
                      setTimeout(async () => {
                        console.log('[VerifyOtp] 🔄 Retry: Calling /api/auth/me again...');
                        const retryRes = await fetch('/api/auth/me', {
                          method: 'GET',
                          credentials: 'include',
                        });
                        
                        console.log('[VerifyOtp] Retry response status:', retryRes.status);
                        
                        if (retryRes.status === 200 && !navigatedRef.current) {
                          console.log('[VerifyOtp] ✅ Cookies verified on retry! Status 200');
                          navigatedRef.current = true;
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('justVerifiedOtp');
                            console.log('[VerifyOtp] Cleared justVerifiedOtp flag from sessionStorage');
                          }
                          console.log('[VerifyOtp] 🚀 REDIRECTING to:', redirectTo);
                          window.location.href = redirectTo;
                        } else if (!navigatedRef.current) {
                          console.error('[VerifyOtp] ❌ Cookies still not valid after retry (status:', retryRes.status, ')');
                          console.error('[VerifyOtp] Redirecting anyway (cookies should be set)...');
                          navigatedRef.current = true;
                          if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('justVerifiedOtp');
                          }
                          console.log('[VerifyOtp] 🚀 REDIRECTING to:', redirectTo);
                          window.location.href = redirectTo;
                        } else {
                          console.log('[VerifyOtp] Already navigated, skipping redirect');
                        }
                      }, 500);
                    }
                  } catch (error) {
                    console.error('[VerifyOtp] ❌ ERROR verifying cookies:', error);
                    console.error('[VerifyOtp] Error details:', {
                      name: error instanceof Error ? error.name : 'Unknown',
                      message: error instanceof Error ? error.message : String(error),
                      stack: error instanceof Error ? error.stack : undefined,
                    });
                    // On error, redirect anyway (cookies should be set)
                    if (!navigatedRef.current) {
                      console.log('[VerifyOtp] Redirecting despite error (cookies should be set)');
                      navigatedRef.current = true;
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('justVerifiedOtp');
                      }
                      console.log('[VerifyOtp] 🚀 REDIRECTING to:', redirectTo);
                      window.location.href = redirectTo;
                    }
                  }
                }, 300); // Wait 300ms for cookies to be set
              } else {
                console.log('[VerifyOtp] ⚠️ OTP verification result:', {
                  isSuccess: result?.isSuccess,
                  navigatedRef: navigatedRef.current,
                  willNotRedirect: !result?.isSuccess || navigatedRef.current,
                });
              }
            } catch (error: unknown) {
              setStatus('invalid');
              const errorMessage = error && typeof error === 'object' && 'data' in error 
                ? (error as { data?: { message?: string } }).data?.message || 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.'
                : 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.';
              setErrorText(errorMessage);
              setTouched(true);
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
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>زمان باقی‌مانده:</span>
                  <span className="font-mono text-red-600 dark:text-red-400 sm:ltr" dir="ltr">{formatTime(timeLeft)}</span>
                </div>
              ) : null}
              
              {canResend && (
                <Button
                  type="button"
                  variant="ghost"
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
              variant="primary"
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
              variant="ghost"
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
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed text-center">
              کد تأیید به شماره تلفن ثبت‌شده در سیستم سازمان ارسال شده است.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
