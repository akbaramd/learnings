'use client';

import React from 'react';
import ToastItem from './ToastItem';
import { useToastContext } from './ToastContext';
import type { ToastPosition } from './toast';

const POS = {
  desktop: {
    'top-right':     'sm:top-4 sm:right-4 sm:left-auto',
    'top-left':      'sm:top-4 sm:left-4 sm:right-auto',
    'bottom-right':  'sm:bottom-4 sm:right-4 sm:left-auto',
    'bottom-left':   'sm:bottom-4 sm:left-4 sm:right-auto',
    'top-center':    'sm:top-4 sm:left-1/2 sm:-translate-x-1/2',
    'bottom-center': 'sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2',
  },
  mobile: {
    top:    'top-0 left-0 right-0 sm:hidden',
    bottom: 'bottom-0 left-0 right-0 sm:hidden',
  },
} as const;

export function ToastContainer({
  position = { desktop: 'bottom-right', mobile: 'bottom' },
  className = '',
}: { position?: ToastPosition; className?: string; }) {
  const { toasts, removeToast } = useToastContext();
  if (!toasts.length) return null;

  return (
    <>
      {/* Desktop stack */}
      <div
        className={[
          'fixed z-50 pointer-events-none hidden sm:block',
          POS.desktop[position.desktop],
          className,
        ].join(' ')}
      >
        <div className="pointer-events-auto flex flex-col-reverse space-y-2 space-y-reverse backdrop-blur-sm">
          {toasts.map((t, i) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} index={i} />
          ))}
        </div>
      </div>

      {/* Mobile full-width, no container padding */}
      <div
        className={[
          'fixed z-50 pointer-events-none sm:hidden',
          POS.mobile[position.mobile],
          className,
        ].join(' ')}
      >
        <div className="pointer-events-auto flex flex-col backdrop-blur-sm">
          {toasts.map((t, i) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} index={i} isMobile />
          ))}
        </div>
      </div>
    </>
  );
}
