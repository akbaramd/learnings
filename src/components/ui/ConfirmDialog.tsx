'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { type ReactNode } from 'react';
import { Button } from './Button';
import { PiX } from 'react-icons/pi';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
  title?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
  disabled?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmText = 'تأیید',
  cancelText = 'لغو',
  variant = 'default',
  isLoading = false,
  disabled = false,
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmVariant: 'danger' as const,
        };
      case 'warning':
        return {
          confirmVariant: 'primary' as const,
        };
      default:
        return {
          confirmVariant: 'primary' as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const isButtonsDisabled = isLoading || disabled;

  return (
    <Dialog open={open} onClose={() => onClose(false)} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-200" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
          <div className="p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              {title && (
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </DialogTitle>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => onClose(false)}
                className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-label="بستن"
              >
                <PiX className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {children && (
              <div className="mb-6">
                {children}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="md"
                onClick={() => onClose(false)}
                disabled={isButtonsDisabled}
                className="min-w-[80px]"
              >
                {cancelText}
              </Button>
              <Button
                variant={variantStyles.confirmVariant}
                size="md"
                onClick={() => onClose(true)}
                loading={isLoading}
                disabled={isButtonsDisabled}
                className="min-w-[80px]"
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default ConfirmDialog;

