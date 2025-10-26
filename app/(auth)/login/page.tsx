'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import InputField from '@/src/components/forms/InputField';
import { useRouter } from 'next/navigation';
import { useSendOtpMutation, selectChallengeId, selectAuthStatus } from '@/src/store/auth';
import { useAppSelector } from '@/src/hooks/store';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';
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
  
  // استفاده مستقیم از RTK Query mutation
  const [sendOtpMutation, { isLoading, error }] = useSendOtpMutation();
  
  // Check authentication and redirect if already logged in
  const { isLoading: isCheckingSession } = useAuthGuard('/dashboard');
  
  // دریافت challengeId و auth status از Redux store
  const challengeId = useAppSelector(selectChallengeId);
  const authStatus = useAppSelector(selectAuthStatus);

  const [nationalId, setNationalId] = useState('2753934177');
  const [status, setStatus] = useState<UiStatus>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  
  // Redirect to verify-otp when challengeId is set (OTP sent successfully)
  useEffect(() => {
    if (challengeId && authStatus === 'otp-sent') {
      router.push('/verify-otp');
    }
  }, [challengeId, authStatus, router]);

  // Show error from mutation
  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setStatus('invalid');
        const errorMessage = error && typeof error === 'object' && 'data' in error 
          ? (error as { data?: { errors?: string[] } }).data?.errors?.[0] || 'خطا در ارسال کد'
          : 'خطا در ارسال کد';
        setErrorText(errorMessage);
        setTouched(true);
      }, 0);
    }
  }, [error]);
  
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

  const canSubmit = !isLoading && !isCheckingSession && nationalId.length === 10;

  // Handlers
  const handleChange = (val: string) => {
    setNationalId(Melli.normalize(val));
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

  // Show loading while checking authentication
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card variant="elevated" padding="md" radius="md" className="w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">در حال بررسی وضعیت ورود...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card
        variant="elevated"
        padding="md"
        radius="md"
        className="w-full"
      >
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">ورود</h1>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              شماره ملی خود را وارد کنید تا ادامه دهید.
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">نکته:</span> شماره ملی باید دقیقاً ۱۰ رقم باشد و شامل چکسام معتبر باشد.
              </p>
            </div>
          </div>

        <form
          noValidate
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();

                    // Prevent multiple submissions
                    if (isLoading) return;

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
              
            } catch (error: unknown) {
              setStatus('invalid');
              const errorMessage = error && typeof error === 'object' && 'data' in error 
                ? (error as { data?: { message?: string } }).data?.message || 'ارسال کد ناموفق. لطفاً شماره ملی خود را بررسی کنید.'
                : 'ارسال کد ناموفق. لطفاً شماره ملی خود را بررسی کنید.';
              setErrorText(errorMessage);
              setTouched(true);
            }
          }}
        >
          <InputField
            ref={inputRef}
            name="national-id"
            label="شماره ملی"
            placeholder="۱۲۳۴۵۶۷۸۹۰"
            description={errorText ?? 'دقیقاً ۱۰ رقم. فقط کاراکترهای عددی پذیرفته می‌شود.'}
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
          
          >
            ادامه
          </Button>
        </form>
      </Card>
    </div>
  );
}
