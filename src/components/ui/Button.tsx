'use client';

import { Button as HUIButton } from '@headlessui/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useMemo } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
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
  // Primary uses design system bg-primary and text-on-primary utilities
  primary: [
    'bg-primary text-on-primary',
    'data-[hover]:bg-emerald-400 dark:data-[hover]:bg-emerald-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400',
  ].join(' '),
  // Secondary uses design system bg-secondary and text-on-secondary utilities
  secondary: [
    'bg-secondary text-on-secondary',
    'data-[hover]:bg-gray-600 dark:data-[hover]:bg-gray-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-gray-500 dark:focus-visible:ring-gray-300',
  ].join(' '),
  // Danger uses design system bg-danger and text-on-danger utilities
  danger: [
    'bg-danger text-on-danger',
    'data-[hover]:bg-red-700 dark:data-[hover]:bg-red-600',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-red-700 dark:focus-visible:ring-red-500',
  ].join(' '),
  // Ghost uses design system bg-ghost class (text color is built into bg-ghost)
  ghost: [
    'bg-ghost',
    'data-[hover]:bg-black/5 dark:data-[hover]:bg-white/10',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
    'focus-visible:ring-gray-300 dark:focus-visible:ring-gray-500',
  ].join(' '),
};

const SIZE_STYLES: Record<Size, string> = {
  xs: 'h-7 px-2 typo-micro',
  sm: 'h-8 px-3 typo-body-2',
  md: 'h-10 px-4 typo-button',
  lg: 'h-12 px-5 typo-body',
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
        // Only apply active transform when not disabled
        isDisabled ? '' : 'active:[transform:scale(.98)]',
        block ? 'w-full' : 'w-auto',
        SIZE_STYLES[size],
        GAP_BY_SIZE[size],
        RADIUS_STYLES[radius],
        // Only apply variant styles when not disabled, otherwise apply disabled background
        // Disabled state handles all hover, focus, and active states via CSS
        isDisabled ? 'bg-disabled cursor-not-allowed' : [VARIANT_STYLES[variant], 'cursor-pointer'].join(' '),
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
          <span className="whitespace-nowrap">{loading ? loadingText : children}</span>
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
