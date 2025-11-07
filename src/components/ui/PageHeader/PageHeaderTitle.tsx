'use client';

import React, { type ReactNode } from 'react';

export interface PageHeaderTitleProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const PageHeaderTitle: React.FC<PageHeaderTitleProps> = ({
  icon,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-5">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate leading-5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default PageHeaderTitle;


