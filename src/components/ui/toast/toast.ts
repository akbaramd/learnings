export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'neutral' | 'destructive';
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  icon?: React.ReactNode;
  action?: ToastAction;
  duration?: number;     // ms; 0 = persistent
  dismissible?: boolean; // default true
  createdAt: number;
}

export type ToastPosition = {
  desktop:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  mobile: 'top' | 'bottom';
};
