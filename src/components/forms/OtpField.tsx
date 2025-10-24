'use client';

import { Field, Label, Description } from '@headlessui/react';
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

type Variant = 'outline' | 'filled';
type Size = 'sm' | 'md' | 'lg';
type Status = 'default' | 'success' | 'danger' | 'typing';
type FocusStrategy = 'start' | 'center' | 'end';

export interface OtpFieldHandle {
  focus: (index?: number) => void;
  clear: () => void;
  setValue: (next: string) => void;
}

export interface OtpFieldProps {
  name?: string;
  label?: string;
  description?: string;
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;

  variant?: Variant;
  size?: Size;
  status?: Status;
  fullWidth?: boolean;

  numericOnly?: boolean;
  mask?: boolean;
  autoFocus?: boolean;
  focusStrategy?: FocusStrategy;

  className?: string;
  cellClassName?: string;
  showLabel?: boolean;        // Control label visibility
  labelPosition?: 'top' | 'center' | 'bottom';  // Label positioning
}

const RADIUS = 'rounded-[2px]';

const SIZE = {
  sm: {
    cell: 'h-9 w-8 text-xs',
    gap: 'gap-2',
    label: 'text-[12px]',
    desc: 'text-[11px]',
  },
  md: {
    cell: 'h-11 w-10 text-sm',
    gap: 'gap-3',
    label: 'text-[13px]',
    desc: 'text-[12px]',
  },
  lg: {
    cell: 'h-12 w-12 text-base',
    gap: 'gap-3',
    label: 'text-[14px]',
    desc: 'text-[12px]',
  },
} as const;

const VARIANT_BASE: Record<Variant, string> = {
  outline: [
    'bg-white dark:bg-gray-800',
    'border',
    'border-neutral-300 dark:border-gray-600',
    'data-[hover]:border-neutral-400 dark:data-[hover]:border-gray-500',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2 dark:focus:ring-offset-gray-800',
  ].join(' '),
  filled: [
    'bg-neutral-50 dark:bg-gray-700',
    'border',
    'border-neutral-200 dark:border-gray-600',
    'data-[hover]:border-neutral-300 dark:data-[hover]:border-gray-500',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2 dark:focus:ring-offset-gray-800',
  ].join(' '),
};

function statusClasses(status: Status) {
  switch (status) {
    case 'success':
      return 'focus:ring-green-600 dark:focus:ring-green-500 focus:border-green-600 dark:focus:border-green-500 border-green-500 dark:border-green-400';
    case 'danger':
      return 'focus:ring-red-600 dark:focus:ring-red-500 focus:border-red-600 dark:focus:border-red-500 border-red-500 dark:border-red-400';
    case 'typing':
      return 'focus:ring-sky-600 dark:focus:ring-sky-500 focus:border-sky-600 dark:focus:border-sky-500 border-sky-400 dark:border-sky-500';
    default:
      return 'focus:ring-sky-600 dark:focus:ring-sky-500 focus:border-sky-600 dark:focus:border-sky-500';
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const OtpField = forwardRef<OtpFieldHandle, OtpFieldProps>(function OtpField(
  {
    name,
    label,
    description,
    length = 6,
    value,
    defaultValue,
    onChange,
    onComplete,
    disabled = false,

    variant = 'outline',
    size = 'md',
    status = 'default',
    fullWidth = true,

    numericOnly = true,
    mask = false,
    autoFocus = false,
    focusStrategy = 'start',

    className,
    cellClassName,
    showLabel = true,
    labelPosition = 'top',
  },
  ref
) {
  const idBase = useId();
  const descId = description ? `${idBase}-desc` : undefined;

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  inputsRef.current = Array.from({ length }, (_, i) => inputsRef.current[i] ?? null);

  const isControlled = value !== undefined;
  const [inner, setInner] = useState<string>(() => (defaultValue ?? '').slice(0, length));
  const val = (isControlled ? value! : inner).slice(0, length);

  const chars = useMemo(() => {
    const pad = ''.padEnd(length, ' ');
    return (val + pad).slice(0, length).split('');
  }, [val, length]);

  useImperativeHandle(ref, () => ({
    focus: (index = 0) => {
      const i = clamp(index, 0, length - 1);
      inputsRef.current[i]?.focus();
      inputsRef.current[i]?.select?.();
    },
    clear: () => {
      updateValue('');
      inputsRef.current[0]?.focus();
    },
    setValue: (next: string) => updateValue(next ?? ''),
  }));

  useEffect(() => {
    if (!autoFocus || disabled) return;
    let index = 0;
    if (focusStrategy === 'center') index = Math.floor(length / 2);
    else if (focusStrategy === 'end') index = Math.max(0, Math.min(length - 1, (val ?? '').length));
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled, length]);

  function normalize(raw: string): string {
    const s = raw ?? '';
    if (!numericOnly) return s;
    return s.replace(/\D/g, '');
  }

  function emit(next: string) {
    if (!isControlled) setInner(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  }

  function updateValue(nextRaw: string) {
    const next = normalize(nextRaw).slice(0, length);
    emit(next);
  }

  function setCharAt(str: string, idx: number, c: string) {
    const arr = str.split('');
    arr[idx] = c;
    return arr.join('');
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>, index: number) {
    const target = e.currentTarget;
    const data = normalize(target.value);

    // Multi-char insert (paste/IME)
    if (data.length > 1) {
      const before = val.padEnd(length, ' ');
      let next = before;
      let i = index;
      for (const ch of data) {
        if (i >= length) break;
        next = setCharAt(next, i, ch);
        i += 1;
      }
      next = next.replace(/ /g, '');
      emit(next);
      const focusTo = clamp(index + data.length, 0, length - 1);
      inputsRef.current[focusTo]?.focus();
      inputsRef.current[focusTo]?.select?.();
      return;
    }

    // Single char overwrite
    const ch = data.slice(-1);
    if (ch) {
      const before = val.padEnd(length, ' ');
      const next = setCharAt(before, index, ch).replace(/ /g, '');
      emit(next);
      if (index < length - 1) {
        inputsRef.current[index + 1]?.focus();
        inputsRef.current[index + 1]?.select?.();
      } else {
        inputsRef.current[index]?.blur();
      }
    } else {
      // Clear current position (no move)
      const before = val.padEnd(length, ' ');
      const next = setCharAt(before, index, ' ').replace(/ /g, '');
      emit(next);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    const key = e.key;

    // navigation
    if (key === 'ArrowLeft') {
      e.preventDefault();
      const to = Math.max(index - 1, 0);
      inputsRef.current[to]?.focus();
      inputsRef.current[to]?.select?.();
      return;
    }
    if (key === 'ArrowRight') {
      e.preventDefault();
      const to = Math.min(index + 1, length - 1);
      inputsRef.current[to]?.focus();
      inputsRef.current[to]?.select?.();
      return;
    }
    if (key === 'Home') {
      e.preventDefault();
      inputsRef.current[0]?.focus();
      inputsRef.current[0]?.select?.();
      return;
    }
    if (key === 'End') {
      e.preventDefault();
      const filled = (val ?? '').length;
      const i = Math.min(Math.max(filled, 0), length - 1);
      inputsRef.current[i]?.focus();
      inputsRef.current[i]?.select?.();
      return;
    }

    // === Deletion behavior (revised) ===
    if (key === 'Backspace') {
      e.preventDefault();
      const before = val.padEnd(length, ' ');
      let next = before;

      if (chars[index] && chars[index] !== ' ') {
        // Current has a char: clear it, then move left
        next = setCharAt(before, index, ' ');
        const to = Math.max(index - 1, 0);
        emit(next.replace(/ /g, ''));
        inputsRef.current[to]?.focus();
        inputsRef.current[to]?.select?.();
      } else {
        // Current empty: move left and clear previous
        const to = Math.max(index - 1, 0);
        next = setCharAt(before, to, ' ');
        emit(next.replace(/ /g, ''));
        inputsRef.current[to]?.focus();
        inputsRef.current[to]?.select?.();
      }
      return;
    }

    if (key === 'Delete') {
      e.preventDefault();
      // Clear current and keep focus here; select for immediate overwrite
      const before = val.padEnd(length, ' ');
      const next = setCharAt(before, index, ' ').replace(/ /g, '');
      emit(next);
      inputsRef.current[index]?.focus();
      inputsRef.current[index]?.select?.();
      return;
    }

    // restrict non-numeric if configured
    if (numericOnly) {
      const ctl = key.length > 1 || e.ctrlKey || e.metaKey || e.altKey;
      if (!ctl && !/^\d$/.test(key)) {
        e.preventDefault();
        return;
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    e.preventDefault();
    const text = e.clipboardData.getData('text') || '';
    const normalized = normalize(text);
    if (!normalized) return;
    const before = val.padEnd(length, ' ');
    let next = before;
    let i = index;
    for (const ch of normalized) {
      if (i >= length) break;
      next = setCharAt(next, i, ch);
      i += 1;
    }
    emit(next.replace(/ /g, ''));
    const focusTo = clamp(index + normalized.length, 0, length - 1);
    inputsRef.current[focusTo]?.focus();
    inputsRef.current[focusTo]?.select?.();
  }

  const wrapper = [
    'flex flex-col',
    fullWidth ? 'w-full' : 'w-auto',
    className || '',
  ].join(' ');

  // Label positioning classes
  const labelClasses = [
    'font-medium text-neutral-800 dark:text-neutral-200',
    SIZE[size].label,
    labelPosition === 'top' ? 'mb-2' : '',
    labelPosition === 'bottom' ? 'mt-2' : '',
    labelPosition === 'center' ? 'text-center' : '',
  ].filter(Boolean).join(' ');

  // Container classes - always horizontal for OTP inputs
  const containerClasses = [
    'flex items-center justify-center',
    fullWidth ? 'w-full' : 'w-auto',
    SIZE[size].gap,
  ].join(' ');

  return (
    <Field disabled={disabled} className={wrapper}>
      {showLabel && label && labelPosition === 'top' && (
        <Label className={labelClasses}>
          {label}
        </Label>
      )}

      {showLabel && label && labelPosition === 'center' && (
        <div className="flex justify-center mb-2">
          <Label className={labelClasses}>
            {label}
          </Label>
        </div>
      )}

      <div
        dir='ltr'
        className={containerClasses}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = chars[i] && chars[i] !== ' ';
          const displayChar = filled ? (mask ? '•' : chars[i]) : '';

          return (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type={mask ? 'password' : 'text'}
              inputMode={numericOnly ? 'numeric' : 'text'}
              pattern={numericOnly ? '\\d*' : undefined}
              autoComplete="one-time-code"
              enterKeyHint={i === length - 1 ? 'done' : 'next'}
              disabled={disabled}
              aria-describedby={descId}
              aria-label={`OTP digit ${i + 1}`}
              maxLength={1}
              value={displayChar}
              onChange={(e) => handleInput(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              onFocus={() => {
                const el = inputsRef.current[i];
                if (el) el.select();
              }}
              onClick={(e) => {
                e.currentTarget.select();
              }}
              className={[
                'px-0 tabular-nums leading-none outline-none text-center',
                'font-medium select-none',
                RADIUS,
                VARIANT_BASE[variant],
                statusClasses(status),
                SIZE[size].cell,
                'caret-neutral-800 dark:caret-neutral-200 placeholder:text-transparent text-neutral-900 dark:text-white',
                'disabled:bg-neutral-100 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',
                'transition-[border-color,box-shadow,background-color] duration-150',
                cellClassName || '',
              ].join(' ')}
            />
          );
        })}
      </div>

      {showLabel && label && labelPosition === 'bottom' && (
        <Label className={labelClasses}>
          {label}
        </Label>
      )}

      {name ? <input type="hidden" name={name} value={val} /> : null}

      {description ? (
        <Description id={descId} className={['mt-2 text-neutral-500 dark:text-neutral-400 text-center', SIZE[size].desc].join(' ')}>
          {description}
        </Description>
      ) : null}
    </Field>
  );
});

export default OtpField;
