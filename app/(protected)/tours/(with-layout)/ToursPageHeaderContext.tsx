'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface ToursPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface ToursPageHeaderContextType {
  headerState: ToursPageHeaderState;
  setHeaderState: (state: ToursPageHeaderState) => void;
}

const ToursPageHeaderContext = createContext<ToursPageHeaderContextType | undefined>(undefined);

export function ToursPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<ToursPageHeaderState>({});

  const updateHeaderState = useCallback((state: ToursPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <ToursPageHeaderContext.Provider value={contextValue}>
      {children}
    </ToursPageHeaderContext.Provider>
  );
}

export function useToursPageHeader() {
  const context = useContext(ToursPageHeaderContext);
  if (!context) {
    throw new Error('useToursPageHeader must be used within ToursPageHeaderProvider');
  }
  return context;
}
