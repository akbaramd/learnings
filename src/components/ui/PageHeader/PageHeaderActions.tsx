'use client';

import React from 'react';
import { PageHeaderAction, type PageHeaderActionProps } from './PageHeaderAction';

export interface PageHeaderActionsProps {
  actions: PageHeaderActionProps[];
  position?: 'left' | 'right';
  className?: string;
}

export const PageHeaderActions: React.FC<PageHeaderActionsProps> = ({
  actions,
  position = 'right',
  className = '',
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {actions.map((action, index) => (
        <PageHeaderAction
          key={`action-${index}`}
          icon={action.icon}
          onClick={action.onClick}
          label={action.label}
          disabled={action.disabled}
          variant={action.variant}
          aria-label={action['aria-label']}
        />
      ))}
    </div>
  );
};

export default PageHeaderActions;


