'use client';

import React, { useEffect, useState } from 'react'; 
import type { Toast, ToastVariant } from './toast';

interface Props {
  toast: Toast;
  onRemove: (id: string) => void;
  index?: number;
  isMobile?: boolean;
}

// Variant tokens – enhanced dark mode support
const TOKENS: Record<ToastVariant, { bg: string; border: string; text: string; icon: string; shadow: string; }> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-900 dark:text-green-100',
    icon: 'text-green-600 dark:text-green-400',
    shadow: 'shadow-green-100 dark:shadow-green-900/20',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
    shadow: 'shadow-red-100 dark:shadow-red-900/20',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-700',
    text: 'text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
    shadow: 'shadow-amber-100 dark:shadow-amber-900/20',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
    shadow: 'shadow-blue-100 dark:shadow-blue-900/20',
  },
  default: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
    icon: 'text-gray-600 dark:text-gray-400',
    shadow: 'shadow-gray-100 dark:shadow-gray-900/20',
  },
};

const DEFAULT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  error:   (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/></svg>),
  warning: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-2.5L13.73 5c-.77-.83-1.96-.83-2.73 0L3.2 16.5c-.77.83.19 2.5 1.73 2.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  info:    (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  default: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

export default function ToastItem({ toast, onRemove, index = 0, isMobile }: Props) {
  const [enter, setEnter] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const t = TOKENS[toast.variant];

  useEffect(() => {
    const id = setTimeout(() => setEnter(true), 10);
    return () => clearTimeout(id);
  }, []);

  const close = () => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 220);
  };

  const icon = toast.icon ?? DEFAULT_ICONS[toast.variant];

  return (
    <div
      className={[
        // container
        'relative pointer-events-auto overflow-hidden',
        'border',
        t.bg, t.border, t.text,
        'transition-all duration-200',
        enter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        leaving ? 'opacity-0 translate-y-2' : '',
        'shadow-lg dark:shadow-xl',
        'px-4 py-4',
        'flex w-full',
        'rounded-[2px]',
        // desktop width
        isMobile ? '' : 'sm:w-[320px]',
        index > 0 ? 'sm:mt-2' : '',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className={['flex-shrink-0', t.icon].join(' ')} aria-hidden="true">
        {icon}
      </div>

      <div className="ml-4 min-w-0 flex-1">
        {toast.title ? <p className="text-sm font-semibold leading-5">{toast.title}</p> : null}
        {toast.description ? <p className="mt-1 text-xs leading-5 opacity-90">{toast.description}</p> : null}

        {toast.action ? (
          <div className="mt-3">
            <button
              onClick={() => { toast.action?.onClick(); if (toast.action?.variant === 'destructive') close(); }}
              className={[
                'text-xs font-medium transition-colors duration-150',
                toast.action.variant === 'destructive'
                  ? 'text-red-700 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200'
                  : toast.action.variant === 'primary'
                  ? 'text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-200'
                  : 'text-gray-700 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200',
              ].join(' ')}
            >
              {toast.action.label}
            </button>
          </div>
        ) : null}
      </div>

      {toast.dismissible && (
        <button
          onClick={close}
          className={[
            'ml-4 inline-flex h-6 w-6 items-center justify-center rounded-[2px]',
            'hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600',
          ].join(' ')}
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Progress bar (scoped) */}
      {toast.duration && toast.duration > 0 ? (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full bg-current/40"
            style={{ animation: `toastShrink ${toast.duration}ms linear forwards` }}
          />
        </div>
      ) : null}

      <style jsx>{`
        @keyframes toastShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
