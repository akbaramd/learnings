'use client';

import React, { type ReactNode } from 'react';
import { IconButton } from '../IconButton';
import type { IconButtonProps } from '../IconButton';

export interface PageHeaderActionProps {
  icon: ReactNode;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  variant?: IconButtonProps['variant'];
  'aria-label'?: string;
}

export const PageHeaderAction: React.FC<PageHeaderActionProps> = ({
  icon,
  onClick,
  label,
  disabled = false,
  variant = 'ghost',
  'aria-label': ariaLabel,
}) => {
  return (
    <IconButton
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label || 'Action'}
      title={label}
    >
      {icon}
    </IconButton>
  );
};

export default PageHeaderAction;


