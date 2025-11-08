'use client';

import { Button as HUIButton } from '@headlessui/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useMemo } from 'react';

type Variant = 'solid' | 'outline' | 'subtle';
type Color = 'primary' | 'secondary' | 'accent';
type Size = 'xs' | 'sm' | 'md' | 'lg';
type Radius = 'xs' | 'sm' | 'md' | 'none';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: Variant;
  color?: Color;
  size?: Size;
  radius?: Radius;             // border radius control; default very small
  loading?: boolean;
  loadingText?: string;        // customizable loading label
  shimmer?: boolean;           // shimmer only when loading
  block?: boolean;             // full width
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Generate variant styles based on variant and color combination
const getVariantStyles = (variant: Variant, color: Color): string => {
  const baseFocusStyles = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800';

  switch (variant) {
    case 'solid':
      return [
        // Solid variants use design system backgrounds and on-* text colors
        `bg-${color} text-on-${color}`,
        `data-[hover]:bg-${color}-hover`,
        baseFocusStyles,
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-400`,
      ].join(' ');

    case 'outline':
      return [
        // Outline variants use border colors, transparent background, and text colors
        `border border-${color} text-${color} bg-transparent`,
        `data-[hover]:bg-${color}-subtle`,
        baseFocusStyles,
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-400`,
      ].join(' ');

    case 'subtle':
      return [
        // Subtle variants use subtle backgrounds and text colors
        `bg-${color}-subtle text-${color}`,
        `data-[hover]:bg-${color}-hover data-[hover]:text-on-${color}`,
        baseFocusStyles,
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : 'blue'}-400`,
      ].join(' ');

    default:
      return '';
  }
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
    variant = 'solid',
    color = 'primary',
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
        isDisabled ? 'bg-disabled cursor-not-allowed' : [getVariantStyles(variant, color), 'cursor-pointer'].join(' '),
        'overflow-hidden', // shimmer overlay containment
      ].join(' '),
    [variant, color, size, block, isDisabled, radius]
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
