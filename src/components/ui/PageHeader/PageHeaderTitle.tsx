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
        <span className="text-body font-medium text-on-surface truncate">
          {title}
        </span>
        {subtitle && (
          <span className="text-caption text-muted font-mono truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default PageHeaderTitle;


