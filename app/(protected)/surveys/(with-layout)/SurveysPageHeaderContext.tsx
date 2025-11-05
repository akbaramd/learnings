'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface SurveysPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface SurveysPageHeaderContextType {
  headerState: SurveysPageHeaderState;
  setHeaderState: (state: SurveysPageHeaderState) => void;
}

const SurveysPageHeaderContext = createContext<SurveysPageHeaderContextType | undefined>(undefined);

export function SurveysPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<SurveysPageHeaderState>({});

  const updateHeaderState = useCallback((state: SurveysPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <SurveysPageHeaderContext.Provider value={contextValue}>
      {children}
    </SurveysPageHeaderContext.Provider>
  );
}

export function useSurveysPageHeader() {
  const context = useContext(SurveysPageHeaderContext);
  if (!context) {
    throw new Error('useSurveysPageHeader must be used within SurveysPageHeaderProvider');
  }
  return context;
}

