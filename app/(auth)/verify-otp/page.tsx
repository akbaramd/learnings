'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import OtpField from '@/src/components/forms/OtpField';
import { useRouter } from 'next/navigation';
import { useToast } from '@/src/hooks/useToast';
import { useSendOtpMutation, useVerifyOtpMutation, selectChallengeId, selectMaskedPhone, selectAuthStatus } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';

type UiStatus = 'idle' | 'typing' | 'valid' | 'invalid';

// Mock phone number - in real app, this would come from props or context
const MOCK_PHONE = '09123456789';

export default function VerifyOtpPage() {
  const router = useRouter();
  
  // استفاده مستقیم از RTK Query hooks
  const [sendOtpMutation, { isLoading: isSendingOtp, error: sendError }] = useSendOtpMutation();
  const [verifyOtpMutation, { isLoading: isVerifyingOtp, error: verifyError }] = useVerifyOtpMutation();
  
  // دریافت challengeId و masked phone از Redux store
  const challengeId = useAppSelector(selectChallengeId);
  const maskedPhone = useAppSelector(selectMaskedPhone);
  const authStatus = useAppSelector(selectAuthStatus);
  
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<UiStatus>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for OTP
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { success, error: showError, info } = useToast();
  
  // محاسبه وضعیت
  const isLoading = isSendingOtp || isVerifyingOtp;
  const error = sendError || verifyError;
  const isAuthenticated = authStatus === 'authenticated';

  // Redirect if authenticated (successful verification)
  useEffect(() => {
    if (isAuthenticated) {
      success('کد تأیید موفق!', 'اکنون می‌توانید وارد شوید.');
      // Navigate to dashboard/index page
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  }, [isAuthenticated, success, router]);


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

  // Debug logging to understand the redirect issue
  useEffect(() => {
    console.log('Verify OTP Page - State:', {
      challengeId,
      authStatus,
      maskedPhone,
      isLoading
    });
  }, [challengeId, authStatus, maskedPhone, isLoading]);

  // Redirect if no challengeId (should come from login)
  useEffect(() => {
    console.log('Redirect check - challengeId:', challengeId, 'authStatus:', authStatus);
    
    // Only redirect if we're absolutely sure there's no challengeId
    // and we're not in any loading or OTP-related state
    if (!challengeId && 
        authStatus !== 'otp-sent' && 
        authStatus !== 'loading' && 
        authStatus !== 'idle') {
      console.log('Redirecting to login - conditions met');
      router.push('/login');
    } else {
      console.log('Not redirecting - challengeId exists or in valid state');
    }
  }, [challengeId, authStatus, router]);

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

  // Format phone number for display (RTL)
  const formatPhoneNumber = useCallback((phone: string) => {
    if (phone.length === 11) {
      return `${phone.slice(0, 4)} *** ${phone.slice(7)}`;
    }
    return phone;
  }, []);

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
    info('ارسال مجدد کد', 'کد تأیید جدید در حال ارسال است...');
    
    try {
      // استفاده مستقیم از mutation hook
      await sendOtpMutation({
        nationalCode: '1234567890', // This should come from the store or be passed as a prop
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
      success('کد ارسال شد', `کد تأیید جدید ارسال شد.`);
      
    } catch (error: unknown) {
      setResendLoading(false);
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error as { data?: { message?: string } }).data?.message || 'ارسال مجدد کد ناموفق بود.'
        : 'ارسال مجدد کد ناموفق بود.';
      showError('خطا', errorMessage);
    }
  }, [canResend, resendLoading, info, success, showError, sendOtpMutation]);

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card
        variant="elevated"
        padding="md"
        radius="md"
        className="w-full"
      >
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">تأیید کد</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              کد ۶ رقمی ارسال شده به شماره تلفن خود را وارد کنید.
            </p>
            <div className="mt-3 p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg border border-neutral-200 dark:border-gray-600">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-medium">شماره تلفن:</span>
                <span className="mr-2 font-mono text-base sm:ltr" dir="ltr">{maskedPhone || formatPhoneNumber(MOCK_PHONE)}</span>
              </p>
              {!canResend ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  زمان باقی‌مانده: <span className="font-mono text-red-600 dark:text-red-400 sm:ltr" dir="ltr">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  می‌توانید کد جدید درخواست کنید
                </p>
              )}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                >
                  تغییر شماره ملی
                </button>
              </div>
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

            info('در حال تأیید کد', 'لطفاً منتظر بمانید تا کد شما تأیید شود...');
            
            // استفاده مستقیم از mutation hook
            try {
              await verifyOtpMutation({
                challengeId: challengeId,
                otpCode: otp
              }).unwrap();
              
              // The useEffect will handle the redirect to dashboard when isAuthenticated becomes true
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
                info('کد کامل شد', 'همه ارقام وارد شد. روی "تأیید کد" کلیک کنید تا ادامه دهید.');
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

          <div className="flex flex-col gap-4">
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
            
            {canResend && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                radius="xs"
                block
                loading={resendLoading}
                loadingText="در حال ارسال..."
                onClick={handleResendOtp}
                disabled={resendLoading}
              >
                ارسال مجدد کد
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
