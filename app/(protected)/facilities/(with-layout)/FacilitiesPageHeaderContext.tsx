'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface FacilitiesPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface FacilitiesPageHeaderContextType {
  headerState: FacilitiesPageHeaderState;
  setHeaderState: (state: FacilitiesPageHeaderState) => void;
}

const FacilitiesPageHeaderContext = createContext<FacilitiesPageHeaderContextType | undefined>(undefined);

export function FacilitiesPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<FacilitiesPageHeaderState>({});

  const updateHeaderState = useCallback((state: FacilitiesPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <FacilitiesPageHeaderContext.Provider value={contextValue}>
      {children}
    </FacilitiesPageHeaderContext.Provider>
  );
}

export function useFacilitiesPageHeader() {
  const context = useContext(FacilitiesPageHeaderContext);
  if (!context) {
    throw new Error('useFacilitiesPageHeader must be used within FacilitiesPageHeaderProvider');
  }
  return context;
}

