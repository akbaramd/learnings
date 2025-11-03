'use client';

import { Button as HUIButton } from '@headlessui/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useMemo } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald';
type Size = 'xs' | 'sm' | 'md' | 'lg';
type Radius = 'xs' | 'sm' | 'md' | 'none';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: Variant;
  size?: Size;
  radius?: Radius;             // border radius control; default very small
  loading?: boolean;
  loadingText?: string;        // customizable loading label
  shimmer?: boolean;           // shimmer only when loading
  block?: boolean;             // full width
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: [
    'bg-green-600 dark:bg-green-500 text-white',
    'data-[hover]:bg-green-700 dark:data-[hover]:bg-green-600',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-green-700 dark:focus-visible:ring-green-500',
    'disabled:bg-neutral-200 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400',
  ].join(' '),
  secondary: [
    'bg-neutral-900 dark:bg-gray-800 text-white',
    'data-[hover]:bg-neutral-800 dark:data-[hover]:bg-gray-700',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-neutral-800 dark:focus-visible:ring-gray-600',
    'disabled:bg-neutral-200 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400',
  ].join(' '),
  danger: [
    'bg-red-600 dark:bg-red-500 text-white',
    'data-[hover]:bg-red-700 dark:data-[hover]:bg-red-600',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-red-700 dark:focus-visible:ring-red-500',
    'disabled:bg-neutral-200 dark:disabled:bg-gray-700 disabled:text-neutral-500 dark:disabled:text-gray-400',
  ].join(' '),
  ghost: [
    'bg-transparent text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-gray-600',
    'data-[hover]:bg-neutral-50 dark:data-[hover]:bg-gray-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-neutral-300 dark:focus-visible:ring-gray-500',
    'disabled:text-neutral-400 dark:disabled:text-gray-500 disabled:border-neutral-200 dark:disabled:border-gray-700',
  ].join(' '),
  emerald: [
    'bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 text-white',
    'data-[hover]:from-emerald-700 data-[hover]:to-emerald-800 dark:data-[hover]:from-emerald-600 dark:data-[hover]:to-emerald-700',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-500',
    'disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:text-gray-200 dark:disabled:text-gray-300',
  ].join(' '),
};

const SIZE_STYLES: Record<Size, string> = {
  xs: 'h-7 px-2 text-[11px]',
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const GAP_BY_SIZE: Record<Size, string> = {
  xs: 'gap-1.5',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-3',
};

const RADIUS_STYLES: Record<Radius, string> = {
  none: 'rounded-none',
  xs: 'rounded-[2px]',   // very small
  sm: 'rounded-[4px]',
  md: 'rounded-[6px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    radius = 'xs',        // default: very small rounded
    loading = false,
    loadingText = 'Loading…',
    shimmer = true,
    block = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    className,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  const base = useMemo(
    () =>
      [
        'relative inline-flex items-center justify-center select-none',
        'transition-[background-color,box-shadow,transform,opacity] duration-150',
        'active:[transform:scale(.98)]',
        block ? 'w-full' : 'w-auto',
        SIZE_STYLES[size],
        GAP_BY_SIZE[size],
        RADIUS_STYLES[radius],
        VARIANT_STYLES[variant],
        isDisabled ? 'cursor-not-allowed opacity-100' : 'cursor-pointer',
        'overflow-hidden', // shimmer overlay containment
      ].join(' '),
    [variant, size, block, isDisabled, radius]
  );

  const shimmerEl =
    loading && shimmer ? (
      <span
        aria-hidden="true"
        className="btnx-shimmer pointer-events-none absolute inset-0"
      />
    ) : null;

  const spinner =
    loading ? (
      <svg viewBox="0 0 24 24" className="btnx-spin h-4 w-4" aria-hidden="true" role="img">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" fill="none" />
      </svg>
    ) : null;

  return (
    <>
      <HUIButton
        ref={ref}
        {...rest}
        className={[base, className || ''].join(' ')}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
      >
        {shimmerEl}

        <span className="pointer-events-none flex items-center justify-center gap-2">
          {loading ? spinner : leftIcon}
          <span>{loading ? loadingText : children}</span>
          {!loading && rightIcon}
        </span>
      </HUIButton>

      {/* Scoped CSS (no globals) */}
      <style jsx>{`
        @keyframes btnx-shimmer-kf {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes btnx-spin-kf {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        :global(.btnx-spin) {
          animation: btnx-spin-kf 1s linear infinite;
        }
        :global(.btnx-shimmer) {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: translateX(-100%);
          animation: btnx-shimmer-kf 1.2s linear infinite;
          mix-blend-mode: screen;
          filter: saturate(1.2);
        }
        :global(.dark .btnx-shimmer) {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
        }
      `}</style>
    </>
  );
});

export default Button;
