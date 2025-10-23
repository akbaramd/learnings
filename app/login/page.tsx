'use client';

import { useEffect, useMemo, useState } from 'react';

/** Iranian National ID (Melli Code) validation.
 * - Must be exactly 10 digits.
 * - Rejects identical-digit values.
 * - Checksum rule per official algorithm.
 */
function isValidIranNationalId(input: string): boolean {
  const code = (input || '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // all digits same

  const check = Number(code[9]);
  const sum =
    code
      .slice(0, 9)
      .split('')
      .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0) % 11;

  return (sum < 2 && check === sum) || (sum >= 2 && check === 11 - sum);
}

type Status = 'idle' | 'typing' | 'valid' | 'invalid';

export default function LoginPage() {
  const [nationalId, setNationalId] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  // Debounced validation on input changes
  useEffect(() => {
    if (nationalId.length === 0) {
      setStatus('idle');
      return;
    }
    setStatus('typing');
    const t = setTimeout(() => {
      const onlyDigits = nationalId.replace(/\D/g, '');
      if (onlyDigits.length === 10) {
        setStatus(isValidIranNationalId(onlyDigits) ? 'valid' : 'invalid');
      } else {
        // still typing < 10 digits -> typing state
        setStatus('typing');
      }
    }, 350);
    return () => clearTimeout(t);
  }, [nationalId]);

  const canSubmit = status === 'valid';

  // End-adornment UI for the input
  const EndAdornment = useMemo(() => {
    if (status === 'typing') {
      return (
        <span
          aria-live="polite"
          aria-label="Validating"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none rounded-full bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700"
        >
          <span className="inline-block animate-dot-1">•</span>
          <span className="inline-block animate-dot-2">•</span>
          <span className="inline-block animate-dot-3">•</span>
        </span>
      );
    }
    if (status === 'valid') {
      return (
        <span
          role="img"
          aria-label="Valid National Number"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white"
        >
          ✓
        </span>
      );
    }
    if (status === 'invalid') {
      return (
        <span
          role="img"
          aria-label="Invalid National Number"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white"
        >
          ✕
        </span>
      );
    }
    return null;
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="grid min-h-screen place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          {/* Card Title */}
          <header className="mb-4">
            <h1 className="text-lg font-semibold text-neutral-900">Sign in</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Enter your National Number to continue.
            </p>
          </header>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              // Submit handling goes here (e.g., call API)
              // For demo, just log:
              console.log('Submit nationalId:', nationalId.replace(/\D/g, ''));
            }}
          >
            {/* National Number Field */}
            <div className="space-y-1">
              <label
                htmlFor="national-id"
                className="block text-sm font-medium text-neutral-800"
              >
                National Number
              </label>
              <div className="relative">
                <input
                  id="national-id"
                  name="national-id"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-describedby="national-id-hint"
                  value={nationalId}
                  onChange={(e) => {
                    // Allow digits only in state, but keep user typing flow simple
                    const raw = e.target.value;
                    const digits = raw.replace(/\D/g, '');
                    setNationalId(digits);
                  }}
                  className={[
                    'w-full rounded-xl border p-4 pr-14 text-base text-neutral-900 outline-none transition',
                    'placeholder:text-neutral-400',
                    // Base border color
                    'border-neutral-300 focus:ring-2 focus:ring-sky-500',
                    status === 'invalid' && 'border-red-500 focus:ring-red-500',
                    status === 'valid' && 'border-green-600 focus:ring-green-600',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  placeholder="XXXXXXXXXX"
                  maxLength={10}
                />
                {EndAdornment}
              </div>
              <p id="national-id-hint" className="text-xs text-neutral-500">
                Exactly 10 digits. Only numeric characters are accepted.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                'w-full rounded-xl p-4 text-sm font-semibold transition',
                canSubmit
                  ? 'bg-green-600 text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700'
                  : 'cursor-not-allowed bg-neutral-200 text-neutral-500',
              ].join(' ')}
            >
              Continue
            </button>
          </form>

          {/* Optional footer */}
          <footer className="mt-4">
            <p className="text-xs text-neutral-500">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
