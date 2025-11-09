'use client';

import React, { type ReactNode } from 'react';
import { PageHeaderTitle } from './PageHeaderTitle';
import { PageHeaderActions } from './PageHeaderActions';
import { type PageHeaderActionProps } from './PageHeaderAction';

export interface PageHeaderProps {
  title: string;
  titleIcon?: ReactNode;
  subtitle?: string;
  leftActions?: PageHeaderActionProps[];
  rightActions?: PageHeaderActionProps[];
  onBack?: () => void;
  backLabel?: string;
  showBackButton?: boolean;
  className?: string;
  contentClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  titleIcon,
  subtitle,
  leftActions = [],
  rightActions = [],
  onBack,
  backLabel = 'بازگشت',
  showBackButton = false,
  className = '',
  contentClassName = '',
}) => {
  const allLeftActions = [...leftActions];
  
  if (showBackButton && onBack) {
    allLeftActions.unshift({
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      ),
      onClick: onBack,
      label: backLabel,
      'aria-label': backLabel,
    });
  }

  return (
    <div
      className={`flex-shrink-0 bg-surface border-t-0 border-b border-subtle ${className}`}
    >
      <div className={`px-4 py-2 ${contentClassName}`}>
        <div className="flex items-center gap-3">
          {allLeftActions.length > 0 && (
            <PageHeaderActions
              actions={allLeftActions}
              position="left"
              className="flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <PageHeaderTitle
              icon={titleIcon}
              title={title}
              subtitle={subtitle}
            />
          </div>

          {rightActions.length > 0 && (
            <PageHeaderActions
              actions={rightActions}
              position="right"
              className="flex-shrink-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;


