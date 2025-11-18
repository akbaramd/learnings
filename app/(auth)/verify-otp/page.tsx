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
  
  // Default to root (/) if no returnUrl - will handle redirect there
  return '/';
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
  useEffect(() => {
    // Wait for auth to be ready
    if (!isReady) {
      return;
    }

    // If user is authenticated, redirect to dashboard or returnUrl
    // Only redirect if we haven't already navigated (prevent double redirect)
    if (isAuthenticated && authStatus === 'authenticated' && !navigatedRef.current) {
      console.log('[VerifyOtp] 🔄 User already authenticated, redirecting to:', redirectTo);
      navigatedRef.current = true;
      window.location.href = redirectTo;
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
      // deviceId, userAgent, and ipAddress are automatically injected by auth.queries.ts
      await sendOtpMutation({
        nationalCode: nationalCode,
        purpose: 'login',
        // deviceId, userAgent, and ipAddress are automatically added by auth.queries.ts
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

            // استفاده مستقیم از mutation hook
            try {
              const result = await verifyOtpMutation({
                challengeId: challengeId!,
                otpCode: otp
              }).unwrap();
              
              // Check if verification was successful
              // API may return status 200 but with isSuccess: false (e.g., invalid/expired OTP)
              if (!result?.isSuccess) {
                // Handle unsuccessful verification (status 200 but isSuccess: false)
                const errorMessage = result?.message || result?.errors?.[0] || 'کد تأیید نامعتبر است. لطفاً دوباره تلاش کنید.';
                
                console.log('[VerifyOtp] ⚠️ OTP verification failed:', {
                  isSuccess: result?.isSuccess,
                  message: result?.message,
                  errors: result?.errors,
                });
                
                // Update UI state
                setStatus('invalid');
                setErrorText(errorMessage);
                setTouched(true);
                
                // Show error toast
                showError('خطا در تأیید', errorMessage);
                
                // Clear OTP field to allow retry
                setOtp('');
                
                return; // Don't redirect
              }
              
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
                
                // Wait a bit for cookies to be set server-side, then redirect
                // Cookies are set by the server in the verifyOtp response
                console.log('[VerifyOtp] Waiting 300ms for cookies to be set server-side...');
                
                setTimeout(() => {
                  if (!navigatedRef.current) {
                    navigatedRef.current = true;
                    
                    // Clear the flag before redirect
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('justVerifiedOtp');
                      console.log('[VerifyOtp] Cleared justVerifiedOtp flag from sessionStorage');
                    }
                    
                    console.log('[VerifyOtp] 🚀 REDIRECTING to:', redirectTo);
                    // Use window.location.href for full page reload to ensure cookies are refreshed
                    window.location.href = redirectTo;
                  }
                }, 300); // Wait 300ms for cookies to be set
              }
            } catch (error: unknown) {
              // Handle network errors or exceptions
              setStatus('invalid');
              const errorMessage = error && typeof error === 'object' && 'data' in error 
                ? (error as { data?: { message?: string; errors?: string[] } }).data?.message 
                  || (error as { data?: { errors?: string[] } }).data?.errors?.[0]
                  || 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.'
                : 'کد تأیید نامعتبر. لطفاً دوباره تلاش کنید.';
              setErrorText(errorMessage);
              setTouched(true);
              showError('خطا', errorMessage);
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
