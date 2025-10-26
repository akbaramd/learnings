// src/components/ui/NotificationBadge.tsx
'use client';

import { cn } from '@/src/components/lib/cn';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ count, className, showZero = false }: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm',
        'border-2 border-white dark:border-gray-800',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}

interface NotificationDotProps {
  className?: string;
}

export function NotificationDot({ className }: NotificationDotProps) {
  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500',
        'border border-white dark:border-gray-800',
        className
      )}
    />
  );
}
