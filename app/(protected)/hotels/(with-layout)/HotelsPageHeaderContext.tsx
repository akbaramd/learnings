'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface ToursPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface HotelsPageHeaderContextType {
  headerState: ToursPageHeaderState;
  setHeaderState: (state: ToursPageHeaderState) => void;
}

const HotelsPageHeaderContext = createContext<HotelsPageHeaderContextType | undefined>(undefined);

export function HotelsPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<ToursPageHeaderState>({});

  const updateHeaderState = useCallback((state: ToursPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <HotelsPageHeaderContext.Provider value={contextValue}>
      {children}
    </HotelsPageHeaderContext.Provider>
  );
}

export function useHotelsPageHeader() {
  const context = useContext(HotelsPageHeaderContext);
  if (!context) {
    throw new Error('useToursPageHeader must be used within ToursPageHeaderProvider');
  }
  return context;
}
