'use client';

import React, { type ReactNode } from 'react';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  children: ReactNode; // The icon component
  'aria-label': string; // Required for accessibility
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export const IconButton = function IconButton({
  children,
  size = 'md',
  variant = 'ghost',
  radius = 'xs',
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: IconButtonProps) {
  // Icon size mapping based on button size
  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Wrap the icon in a span with size classes
  const iconWithSize = (
    <span className={iconSizeClasses[size]}>
      {children}
    </span>
  );

  return (
    <Button
      {...rest}
      size={size}
      variant={variant}
      radius={radius}
      className={className}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {iconWithSize}
    </Button>
  );
};

export default IconButton;
