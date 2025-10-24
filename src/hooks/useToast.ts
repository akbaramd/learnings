'use client';

import { useCallback } from 'react';
import { useToastContext } from '../components/ui/toast/ToastContext';
import type { ToastAction, ToastVariant } from '../components/ui/toast/toast';

interface UseToastDefaults {
  duration?: number;
  dismissible?: boolean;
}
interface PublishOptions extends UseToastDefaults {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  icon?: React.ReactNode;
  action?: ToastAction;
}
const DEFAULT_DURATION = 5000;

export function useToast(defaults: UseToastDefaults = {}) {
  const { addToast, removeToast, clearAllToasts, toasts } = useToastContext();

  const publish = useCallback((opts: PublishOptions) => {
    return addToast({
      variant: opts.variant ?? 'default',
      title: opts.title,
      description: opts.description,
      icon: opts.icon,
      action: opts.action,
      duration: opts.duration ?? defaults.duration ?? DEFAULT_DURATION,
      dismissible: opts.dismissible ?? defaults.dismissible ?? true,
    });
  }, [addToast, defaults.duration, defaults.dismissible]);

  const success = useCallback((title: string, description?: string, action?: ToastAction) =>
    publish({ variant: 'success', title, description, action }), [publish]);

  const error   = useCallback((title: string, description?: string, action?: ToastAction) =>
    publish({ variant: 'error', title, description, action }), [publish]);

  const warning = useCallback((title: string, description?: string, action?: ToastAction) =>
    publish({ variant: 'warning', title, description, action }), [publish]);

  const info    = useCallback((title: string, description?: string, action?: ToastAction) =>
    publish({ variant: 'info', title, description, action }), [publish]);

  const custom  = useCallback((opts: PublishOptions) => publish(opts), [publish]);

  return { toast: publish, success, error, warning, info, custom, remove: removeToast, clearAll: clearAllToasts, toasts };
}
