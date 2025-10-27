'use client';

import React, { type ReactNode } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // The icon component
  'aria-label': string; // Required for accessibility
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  variant?: 'ghost' | 'solid' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const IconButton = function IconButton({
  children,
  size = 'sm',
  variant = 'ghost',
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: IconButtonProps) {
  // Consistent small button size for all variants
  const buttonSizeClasses = 'h-10 w-10';
  
  // Icon size - small for all variants
  const iconSizeClasses = 'h-4 w-4';
  
  // Variant styles
  const variantClasses = {
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    solid: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 border border-gray-900 dark:border-gray-100',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  return (
    <button
      {...rest}
      className={`
        ${buttonSizeClasses}
        ${variantClasses[variant]}
        rounded-lg
        flex items-center justify-center
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `.trim()}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <span className={iconSizeClasses}>
        {children}
      </span>
    </button>
  );
};

export default IconButton;
