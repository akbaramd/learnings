'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Toast } from './toast';

type State = { toasts: Toast[] };
type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
} | null>(null);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': return { toasts: [...state.toasts, action.toast] };
    case 'REMOVE': return { toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'CLEAR': return { toasts: [] };
    default: return state;
  }
}

export function ToastProvider({
  children,
  maxToasts = 6,
  defaultDuration = 5000,
}: {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  const addToast = useCallback((t: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = `t-${crypto.randomUUID()}`;
    const toast: Toast = {
      ...t,
      id,
      createdAt: Date.now(),
      duration: t.duration ?? defaultDuration,
      dismissible: t.dismissible ?? true,
    };
    dispatch({ type: 'ADD', toast });

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), toast.duration);
    }
    return id;
  }, [defaultDuration]);

  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
  const clearAllToasts = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  // enforce max visible
  useEffect(() => {
    if (state.toasts.length > maxToasts) {
      const overflow = state.toasts
        .slice()
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, state.toasts.length - maxToasts);
      overflow.forEach(t => dispatch({ type: 'REMOVE', id: t.id }));
    }
  }, [state.toasts, maxToasts]);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}
