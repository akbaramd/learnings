'use client';

import { Field, Label, Description } from '@headlessui/react';
import type { ChangeEvent, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId, useMemo, useRef } from 'react';

type Variant = 'outline' | 'filled';
type Size = 'sm' | 'md' | 'lg';
type Status = 'default' | 'success' | 'danger' | 'typing';

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  description?: string;
  variant?: Variant;
  size?: Size;
  status?: Status;
  fullWidth?: boolean;
  requiredMark?: boolean;  // append * to label
  showValidationBox?: boolean;  // render trailing status box (default: true)
  showBoxOnSuccess?: boolean;   // render box in success state (default: false)
}

const RADIUS = 'rounded-[2px]'; // very small radius

const SIZE_CLASSES: Record<
  Size,
  { rootGap: string; textarea: string; label: string; desc: string; addon: string }
> = {
  sm: {
    rootGap: 'gap-1.5',
    textarea: 'min-h-[60px] px-3 py-2 text-xs',
    label: 'text-[12px]',
    desc: 'text-[11px]',
    addon: 'h-8 min-w-8 text-[12px]',
  },
  md: {
    rootGap: 'gap-2',
    textarea: 'min-h-[80px] px-3.5 py-2.5 text-sm',
    label: 'text-[13px]',
    desc: 'text-[12px]',
    addon: 'h-10 min-w-10 text-[13px]',
  },
  lg: {
    rootGap: 'gap-2',
    textarea: 'min-h-[100px] px-4 py-3 text-base',
    label: 'text-[14px]',
    desc: 'text-[12px]',
    addon: 'h-12 min-w-12 text-[14px]',
  },
};

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

// ring + border by status
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

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      id,
      name,
      label,
      description,
      variant = 'outline',
      size = 'md',
      status = 'default',
      fullWidth = true,
      required,
      requiredMark = true,
      disabled,
      className,
      onChange,
      showValidationBox = false,
      showBoxOnSuccess = false,
      rows = 4,
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const textareaId = id ?? `ta-${autoId}`;
    const descId = description ? `${textareaId}-desc` : undefined;
    const sizeCfg = SIZE_CLASSES[size];
    const textareaEl = useRef<HTMLTextAreaElement>(null);

    const textareaClasses = useMemo(
      () =>
        [
          'peer',
          RADIUS,
          'w-full',
          'resize-y',
          sizeCfg.textarea,
          VARIANT_BASE[variant],
          statusClasses(status),
          'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-gray-400',
          'disabled:bg-neutral-100 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',
          'transition-[border-color,box-shadow,background-color] duration-150',
        ].join(' '),
      [sizeCfg.textarea, variant, status]
    );

    const wrapperClasses = useMemo(
      () =>
        [
          'flex flex-col',
          sizeCfg.rootGap,
          fullWidth ? 'w-full' : 'w-auto',
          disabled ? 'data-[disabled]:opacity-50' : '',
        ].join(' '),
      [sizeCfg.rootGap, fullWidth, disabled]
    );

    const groupClasses = useMemo(
      () =>
        ['flex items-stretch gap-2', fullWidth ? 'w-full' : 'w-auto'].join(' '),
      [fullWidth]
    );

    const addonBase =
      'grid place-items-center select-none border ' + RADIUS + ' px-2';

    // Auto status trailing control
    let autoRight: ReactNode = null;
    if (showValidationBox) {
      if (status === 'typing') {
        autoRight = (
          <button
            type="button"
            onClick={() => (textareaEl.current ?? undefined)?.focus()}
            className={[
              addonBase,
              sizeCfg.addon,
              'border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-neutral-500 dark:text-gray-400',
            ].join(' ')}
            title="Typing…"
            aria-label="Typing"
          >
            <span className="ta-dots text-neutral-500" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
          </button>
        );
      } else if (status === 'danger') {
        autoRight = (
          <button
            type="button"
            onClick={() => (textareaEl.current ?? undefined)?.focus()}
            className={[
              addonBase,
              sizeCfg.addon,
              'border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white',
            ].join(' ')}
            title="Invalid"
            aria-label="Invalid"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        );
      } else if (status === 'success') {
        // success: by default no box, only green outline
        if (showBoxOnSuccess) {
          autoRight = (
            <button
              type="button"
              onClick={() => (textareaEl.current ?? undefined)?.focus()}
              className={[
                addonBase,
                sizeCfg.addon,
                'border-green-600 dark:border-green-500 bg-green-600 dark:bg-green-500 text-white',
              ].join(' ')}
              title="Valid"
              aria-label="Valid"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        }
      } else {
        // default: neutral indicator box so textarea never looks empty
        autoRight = (
          <button
            type="button"
            onClick={() => (textareaEl.current ?? undefined)?.focus()}
            className={[
              addonBase,
              sizeCfg.addon,
              'border-neutral-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-neutral-400 dark:text-gray-500',
            ].join(' ')}
            title="Enter value"
            aria-label="Awaiting input"
          >
            {/* text-cursor icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 4v16M8 8h8M8 16h8" strokeLinecap="round" />
            </svg>
          </button>
        );
      }
    }

    const labelContent =
      label && required && requiredMark ? (
        <>
          {label}
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        </>
      ) : (
        label
      );

    const ariaInvalid = status === 'danger' ? true : undefined;

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
    };

    return (
      <>
        <Field disabled={disabled} className={wrapperClasses}>
          {label ? (
            <Label
              htmlFor={textareaId}
              className={[
                'font-medium text-neutral-800 dark:text-neutral-200',
                sizeCfg.label,
                'data-[disabled]:opacity-50',
              ].join(' ')}
            >
              {labelContent}
            </Label>
          ) : null}

          <div className={groupClasses}>
            <textarea
              ref={(node) => {
                if (typeof ref === 'function') ref(node as HTMLTextAreaElement);
                textareaEl.current = node as HTMLTextAreaElement | null;
              }}
              id={textareaId}
              name={name}
              aria-describedby={descId}
              aria-invalid={ariaInvalid}
              disabled={disabled}
              className={[textareaClasses, className || ''].join(' ')}
              onChange={handleChange}
              rows={rows}
              {...rest}
            />

            {autoRight}
          </div>

          {description ? (
            <Description
              id={descId}
              className={[sizeCfg.desc, 'text-neutral-500 dark:text-neutral-400 data-[disabled]:opacity-50'].join(' ')}
            >
              {description}
            </Description>
          ) : null}
        </Field>

        {/* Scoped animations: 3-dot typing */}
        <style jsx>{`
          @keyframes ta-bounce {
            0%, 80%, 100% { transform: scale(0); opacity: .4; }
            40% { transform: scale(1); opacity: 1; }
          }
          .ta-dots {
            display: inline-grid;
            grid-auto-flow: column;
            gap: 4px;
            /* ensure visible color even on white backgrounds */
            color: #6b7280; /* neutral-500 fallback */
          }
          .ta-dots i {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background: currentColor;
            animation: ta-bounce 1.2s infinite ease-in-out both;
          }
          .ta-dots i:nth-child(1) { animation-delay: -0.24s; }
          .ta-dots i:nth-child(2) { animation-delay: -0.12s; }
          .ta-dots i:nth-child(3) { animation-delay: 0s; }
        `}</style>
      </>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;
