'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import InputField from '@/src/components/forms/InputField';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useSendOtpMutation, useLazyValidateNationalCodeQuery, selectChallengeId, selectAuthStatus, selectIsUserNotFoundError, selectAuthErrorInfo, setAuthStatus } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { useAuth } from '@/src/hooks/useAuth';
import { PiShieldCheck, PiWarningCircle } from 'react-icons/pi';
import Drawer, { DrawerHeader, DrawerBody, DrawerFooter } from '@/src/components/overlays/Drawer';
/* ---- Iranian National ID (Melli) utilities ---- */
const Melli = {
  normalize(raw: string): string {
    return (raw || '').replace(/\D/g, '').slice(0, 10);
  },
  validate(codeInput: string):
    | { ok: true }
    | { ok: false; reason: 'length' | 'repeating' | 'checksum' } {
    const code = (codeInput || '').replace(/\D/g, '');
    if (code.length !== 10) return { ok: false, reason: 'length' };
    if (/^(\d)\1{9}$/.test(code)) return { ok: false, reason: 'repeating' };

    const check = Number(code[9]);
    const sum =
      code
        .slice(0, 9)
        .split('')
        .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0) % 11;

    const valid = (sum < 2 && check === sum) || (sum >= 2 && check === 11 - sum);
    return valid ? { ok: true } : { ok: false, reason: 'checksum' };
  },
} as const;

type UiStatus = 'idle' | 'typing' | 'valid' | 'invalid';

export default function LoginPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  
  // استفاده مستقیم از RTK Query mutation
  const [sendOtpMutation, { isLoading, error }] = useSendOtpMutation();
  
  // Check authentication and redirect if already logged in
  
  // Use useAuth hook for authentication state
  const { isAuthenticated, isReady } = useAuth();
  
  // دریافت challengeId و auth status از Redux store
  const challengeId = useAppSelector(selectChallengeId);
  const authStatus = useAppSelector(selectAuthStatus);
  const isUserNotFoundError = useAppSelector(selectIsUserNotFoundError);
  const errorInfo = useAppSelector(selectAuthErrorInfo);

  const [nationalId, setNationalId] = useState('');
  const [status, setStatus] = useState<UiStatus>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [showNotFoundDrawer, setShowNotFoundDrawer] = useState(false);
  const [notFoundNationalId, setNotFoundNationalId] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValidFormat?: boolean;
    exists?: boolean;
    fullName?: string | null;
    membershipNumber?: string | null;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Track if drawer has been shown for current error to prevent reopening on input change
  const drawerShownForErrorRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);
  
  // Lazy query for validating national code
  const [validateNationalCode, { isLoading: isValidatingQuery }] = useLazyValidateNationalCodeQuery();
  
  // Get return URL and logout flag from query params
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [returnUrl] = useState<string | null>(() => {
    const r = params?.get('r');
    return r || null;
  });
  const isLogoutFlow = params?.get('logout') === 'true';
  
  // Check if user is authenticated and redirect to dashboard
  // Also ensure state is 'anonymous' if we're in logout flow and state is 'idle'
  useEffect(() => {
    // Wait for auth to be ready
    if (!isReady) {
      return;
    }
    
    // If we're in logout flow and status is 'idle' (initial state after page reload),
    // set it to 'anonymous' to ensure correct state
    if (isLogoutFlow && authStatus === 'idle') {
      dispatch(setAuthStatus('anonymous'));
      return;
    }
    
    // Don't redirect if we're in logout flow
    if (isLogoutFlow) {
      return;
    }
    
    // If user is authenticated, redirect to dashboard or returnUrl
    if (isAuthenticated) {
      const redirectTo = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/http')
        ? returnUrl
        : '/dashboard';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isReady, isLogoutFlow, returnUrl, router, authStatus, dispatch]);
  
  // Redirect to verify-otp when challengeId is set (OTP sent successfully)
  useEffect(() => {
    if (challengeId && authStatus === 'otp-sent') {
      const redirectTo = returnUrl ? `/verify-otp?r=${encodeURIComponent(returnUrl)}` : '/verify-otp';
      router.push(redirectTo);
    }
  }, [challengeId, authStatus, router, returnUrl]);

  // Show error from mutation - handle user not found with drawer
  useEffect(() => {
    const currentErrorKey = errorInfo.message ? `${isUserNotFoundError}-${errorInfo.message}` : null;
    
    // Only show drawer if it's a new user_not_found error (not shown before)
    if (isUserNotFoundError && errorInfo.message && drawerShownForErrorRef.current !== currentErrorKey) {
      // Mark this error as shown
      drawerShownForErrorRef.current = currentErrorKey;
      previousErrorRef.current = errorInfo.message;
      
      // Show drawer for user not found error
      setTimeout(() => {
        setNotFoundNationalId(nationalId);
        setShowNotFoundDrawer(true);
        setStatus('invalid');
        setErrorText(null); // Don't show error in input field for user not found
      }, 0);
    } else if (error && !isUserNotFoundError) {
      // Show regular error in input field
      setTimeout(() => {
        setStatus('invalid');
        const errorMessage = error && typeof error === 'object' && 'data' in error 
          ? (error as { data?: { errors?: string[] } }).data?.errors?.[0] || errorInfo.message || 'خطا در ارسال کد'
          : errorInfo.message || 'خطا در ارسال کد';
        setErrorText(errorMessage);
        setTouched(true);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, isUserNotFoundError, errorInfo.message]);
  
  // Derived field status for InputField
  const fieldStatus = useMemo(() => {
    if (status === 'invalid') return 'danger';
    if (status === 'valid') return 'success';
    if (status === 'typing') return 'typing';
    return 'default';
  }, [status]);

  // Explain validation errors
  const explain = useCallback((raw: string): string | null => {
    const res = Melli.validate(raw);
    if (res.ok) return null;
    switch (res.reason) {
      case 'length':
        return 'شماره ملی باید دقیقاً ۱۰ رقم باشد.';
      case 'repeating':
        return 'شماره ملی نامعتبر: همه ارقام نمی‌توانند یکسان باشند.';
      case 'checksum':
        return 'شماره ملی نامعتبر: بررسی چکسام ناموفق. لطفاً شماره ملی خود را بررسی کنید.';
      default:
        return 'مقدار نامعتبر.';
    }
  }, []);

  // Debounced live validation while typing
  useEffect(() => {
    const digits = Melli.normalize(nationalId);
    
    if (!digits) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setStatus('idle');
        setErrorText(null);
      }, 0);
      return;
    }
    
    setTimeout(() => setStatus('typing'), 0);
    const t = setTimeout(() => {
      const res = Melli.validate(digits);
      if (res.ok) {
        setStatus('valid');
        setErrorText(null);
      } else {
        setStatus('invalid');
        // show error only after first blur/submit; keep live UI icon otherwise
        setErrorText(touched ? explain(digits) : null);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [nationalId, touched, explain]);

  const canSubmit = !isLoading  && nationalId.length === 10;

  // Handlers
  const handleChange = (val: string) => {
    const normalized = Melli.normalize(val);
    setNationalId(normalized);
    
    // Close drawer if open when user starts typing
    if (showNotFoundDrawer) {
      setShowNotFoundDrawer(false);
      drawerShownForErrorRef.current = null;
      previousErrorRef.current = null;
      setValidationResult(null);
      setValidationError(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const reason = explain(nationalId);
    setErrorText(reason);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Allow control/navigation keys
    const allowed =
      [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Enter',
      ].includes(e.key) || (e.ctrlKey || e.metaKey); // copy/paste/select all
    if (allowed) return;

    // Block non-digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const normalized = Melli.normalize(text);
    setNationalId(normalized);
    // move caret to end
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.selectionStart = el.selectionEnd = normalized.length;
      }
    });
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 ">
      {/* Title above card */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
          سامانه خدمات رفاهی   
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          نظام مهندسی ساختمان آذربایجان غربی
        </p>
      </div>
      
      <Card
        variant="elevated"
        padding="md"
        radius="md"
        className="w-full max-w-md"
      >
          <div className="mb-6 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <PiShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">ورود به سامانه</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              برای ورود، شماره ملی خود را وارد کنید
            </p>
          </div>

        <form
          noValidate
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();

                    // Prevent multiple submissions
                    if (isLoading) return;

            // Prevent sending OTP if user is already authenticated
            // This can happen if session is restored after page load
            if (authStatus === 'authenticated' && !isLogoutFlow) {
              const redirectTo = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/http')
                ? returnUrl
                : '/dashboard';
              router.replace(redirectTo);
              return;
            }

            // Final guard
            const res = Melli.validate(nationalId);
            if (!res.ok) {
              setTouched(true);
              setStatus('invalid');
              setErrorText(explain(nationalId));
              return;
            }

            // استفاده مستقیم از RTK Query mutation
            try {
              // استفاده از mutation hook
              await sendOtpMutation({
                nationalCode: nationalId,
                purpose: 'login',
                deviceId: 'web-browser'
              }).unwrap();
              
              // The useEffect will handle the redirect when challengeId is set
              // The useEffect will also handle user not found errors via selectors
              
            } catch (error: unknown) {
              // Error handling is now done via Redux store and selectors
              // The useEffect hook will check isUserNotFoundError and show drawer accordingly
              // For other errors, show in input field
              if (!isUserNotFoundError) {
                const errorData = error && typeof error === 'object' && 'data' in error 
                  ? (error as { data?: { message?: string } }).data
                  : null;
                
                const errorMessage = errorData?.message || errorInfo.message || 'ارسال کد ناموفق. لطفاً شماره ملی خود را بررسی کنید.';
                setStatus('invalid');
                setErrorText(errorMessage);
                setTouched(true);
              }
            }
          }}
        >
          <InputField
            ref={inputRef}
            name="national-id"
            label="شماره ملی"
            placeholder="شماره ملی خود را وارد کنید"
            description={errorText ?? 'شماره ملی باید دقیقاً ۱۰ رقم باشد و شامل چکسام معتبر باشد'}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            pattern="\d{10}"
            maxLength={10}
            variant="outline"
            size="md"
            showBoxOnSuccess={false}
            showValidationBox={false} 
            status={fieldStatus}
            required
            value={nationalId}
            disabled={isLoading}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            aria-invalid={status === 'invalid'}
            aria-describedby="national-id-desc"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            radius="xs"
            block
            loading={isLoading}
            loadingText="در حال ارسال کد..."
            shimmer
            disabled={!canSubmit}
            className="mt-2"
          >
            ارسال کد تأیید
          </Button>
          
          {/* Subtle notice about organization membership */}
          <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
            این سامانه مخصوص اعضای سازمان است. در صورت مشکل در ورود، با پشتیبانی تماس بگیرید.
          </p>
        </form>
      </Card>

      {/* Drawer for user not found error */}
      <Drawer
        open={showNotFoundDrawer}
        onClose={setShowNotFoundDrawer}
        side="bottom"
        size="md"
        closeOnBackdrop={true}
        closeOnEsc={true}
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <PiWarningCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                کد ملی پیدا نشد
              </h3>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              متأسفانه کاربری با کد ملی وارد شده در سیستم یافت نشد.
            </p>
            
            {notFoundNationalId && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  کد ملی وارد شده:
                </p>
                <p className="text-base font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {notFoundNationalId}
                </p>
              </div>
            )}

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${
                  validationResult.exists 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : validationResult.isValidFormat === false
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="space-y-2">
                    {/* Format Validation */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        اعتبارسنجی فرمت:
                      </span>
                      <span className={`text-sm font-semibold ${
                        validationResult.isValidFormat 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {validationResult.isValidFormat ? '✓ معتبر' : '✗ نامعتبر'}
                      </span>
                    </div>

                    {/* Existence Check */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        وجود در سیستم:
                      </span>
                      <span className={`text-sm font-semibold ${
                        validationResult.exists 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {validationResult.exists ? '✓ موجود است' : '✗ موجود نیست'}
                      </span>
                    </div>

                    {/* Full Name (if exists) */}
                    {validationResult.exists && validationResult.fullName && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                          نام و نام خانوادگی:
                        </p>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {validationResult.fullName}
                        </p>
                      </div>
                    )}

                    {/* Membership Number (if exists) */}
                    {validationResult.exists && validationResult.membershipNumber && (
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                          شماره عضویت:
                        </p>
                        <p className="text-sm font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                          {validationResult.membershipNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {validationResult.exists && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                      ✓ این کد ملی در سیستم ثبت شده است. در صورت مشکل در ورود، با پشتیبانی تماس بگیرید.
                    </p>
                  </div>
                )}

                {!validationResult.exists && validationResult.isValidFormat && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      ⚠️ این کد ملی معتبر است اما در سیستم ثبت نشده است. لطفاً با پشتیبانی تماس بگیرید.
                    </p>
                  </div>
                )}

                {validationResult.isValidFormat === false && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      ✗ فرمت کد ملی نامعتبر است. لطفاً شماره ملی خود را بررسی کنید.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  خطا در اعتبارسنجی: {validationError}
                </p>
              </div>
            )}

            {!validationResult && !validationError && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                اگر فکر می‌کنید این کد ملی باید در سیستم ثبت شده باشد، می‌توانید درخواست بررسی کنید.
              </p>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              block
              onClick={() => {
                setShowNotFoundDrawer(false);
                drawerShownForErrorRef.current = null;
                previousErrorRef.current = null;
                setValidationResult(null);
                setValidationError(null);
                // Clear the input to allow user to try again
                setNationalId('');
                setStatus('idle');
                setErrorText(null);
              }}
            >
              بستن
            </Button>
            <Button
              variant="primary"
              size="md"
              block
              loading={isValidating || isValidatingQuery}
              loadingText="در حال بررسی..."
              disabled={isValidating || isValidatingQuery || !notFoundNationalId}
              onClick={async () => {
                if (!notFoundNationalId) return;
                
                setIsValidating(true);
                setValidationError(null);
                setValidationResult(null);
                
                try {
                  const result = await validateNationalCode({ 
                    nationalCode: notFoundNationalId 
                  }).unwrap();
                  
                  if (result?.isSuccess && result?.data) {
                    setValidationResult({
                      isValidFormat: result.data.isValidFormat,
                      exists: result.data.exists,
                      fullName: result.data.fullName || null,
                      membershipNumber: result.data.membershipNumber || null,
                    });
                  } else {
                    setValidationError(
                      result?.message || 
                      result?.errors?.[0] || 
                      'خطا در اعتبارسنجی کد ملی'
                    );
                  }
                } catch (error: unknown) {
                  const errorMessage = error && typeof error === 'object' && 'data' in error
                    ? (error as { data?: { message?: string; errors?: string[] } }).data?.errors?.[0] 
                      || (error as { data?: { message?: string } }).data?.message
                    : 'خطا در اعتبارسنجی کد ملی';
                  
                  setValidationError(errorMessage || 'خطا در اعتبارسنجی کد ملی');
                } finally {
                  setIsValidating(false);
                }
              }}
            >
              {validationResult ? 'بررسی مجدد' : 'درخواست بررسی کد ملی'}
            </Button>
          </div>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}
