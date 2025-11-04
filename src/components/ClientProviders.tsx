'use client';

import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './ui/toast/ToastContext';
import { ToastContainer } from './ui/toast/ToastContainer';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
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
}