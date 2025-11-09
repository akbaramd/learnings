'use client';

import React, { type ReactNode, useMemo } from 'react';

type Variant = 'solid' | 'outline' | 'subtle';
type Color = 'primary' | 'secondary' | 'accent' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // The icon component
  'aria-label': string; // Required for accessibility
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  variant?: Variant;
  color?: Color;
  size?: Size;
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
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-400`,
      ].join(' ');

    case 'outline':
      return [
        // Outline variants use border colors, transparent background, and text colors
        `border border-${color} text-${color} bg-transparent`,
        `data-[hover]:bg-${color}-subtle`,
        baseFocusStyles,
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-400`,
      ].join(' ');

    case 'subtle':
      return [
        // Subtle variants use subtle backgrounds and text colors
        `bg-${color}-subtle text-${color}`,
        `data-[hover]:bg-${color}-hover data-[hover]:text-on-${color}`,
        baseFocusStyles,
        `focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-500 dark:focus-visible:ring-${color === 'primary' ? 'emerald' : color === 'secondary' ? 'gray' : color === 'danger' ? 'red' : 'blue'}-400`,
      ].join(' ');

    default:
      return '';
  }
};

const SIZE_STYLES: Record<Size, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const ICON_SIZE_STYLES: Record<Size, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const IconButton = function IconButton({
  children,
  size = 'sm',
  variant = 'subtle',
  color = 'primary',
  className = '',
  disabled,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: IconButtonProps) {
  const isDisabled = disabled;

  const base = useMemo(
    () =>
      [
        'relative inline-flex items-center justify-center select-none',
        'transition-[background-color,box-shadow,transform,opacity] duration-150',
        // Only apply active transform when not disabled
        isDisabled ? '' : 'active:[transform:scale(.98)]',
        SIZE_STYLES[size],
        'rounded-lg',
        // Only apply variant styles when not disabled, otherwise apply disabled background
        // Disabled state handles all hover, focus, and active states via CSS
        isDisabled ? 'bg-disabled cursor-not-allowed' : [getVariantStyles(variant, color), 'cursor-pointer'].join(' '),
      ].join(' '),
    [variant, color, size, isDisabled]
  );

  return (
    <button
      {...rest}
      className={[base, className || ''].join(' ')}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-disabled={isDisabled || undefined}
    >
      <span className={ICON_SIZE_STYLES[size]}>
        {children}
      </span>
    </button>
  );
};

export default IconButton;
