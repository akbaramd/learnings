'use client';

import React from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './ui/toast/ToastContext';
import { ToastContainer } from './ui/toast/ToastContainer';

interface ClientProvidersProps {
  children: React.ReactNode;
}

// Memoize to prevent unnecessary re-renders
export const ClientProviders = React.memo(function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <div>
        <ToastProvider maxToasts={5} defaultDuration={5000}>
          {children}
          <ToastContainer 
            position={{ 
              desktop: 'bottom-left', 
              mobile: 'bottom' 
            }} 
          />
        </ToastProvider>
      </div>
    </ThemeProvider>
  );
});