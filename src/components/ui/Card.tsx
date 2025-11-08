'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  className?: string;
}

const CARD_VARIANTS = {
  default: [
    'bg-surface',
    'border border-subtle',
  ].join(' '),
  outlined: [
    'bg-surface',
    'border-2 border-subtle',
  ].join(' '),
  elevated: [
    'bg-surface',
    'border border-subtle',
  ].join(' '),
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const RADIUS_CLASSES = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    variant = 'default',
    padding = 'md',
    radius = 'lg',
    hover = false,
    clickable = false,
    className = '',
    ...rest
  },
  ref
) {
  const hoverClasses = hover
    ? 'hover:border-gray-300 dark:hover:border-gray-600'
    : '';
  
  const clickableClasses = clickable
    ? 'cursor-pointer'
    : '';

  const cardClasses = [
    CARD_VARIANTS[variant],
    PADDING_CLASSES[padding],
    RADIUS_CLASSES[radius],
    'transition-all duration-200',
    hoverClasses,
    clickableClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
