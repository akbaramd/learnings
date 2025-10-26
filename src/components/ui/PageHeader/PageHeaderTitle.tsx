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
    <div className={`flex items-center gap-2 ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default PageHeaderTitle;


