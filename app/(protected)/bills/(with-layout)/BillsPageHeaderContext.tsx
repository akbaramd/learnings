'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface BillsPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface BillsPageHeaderContextType {
  headerState: BillsPageHeaderState;
  setHeaderState: (state: BillsPageHeaderState) => void;
}

const BillsPageHeaderContext = createContext<BillsPageHeaderContextType | undefined>(undefined);

export function BillsPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<BillsPageHeaderState>({});

  const updateHeaderState = useCallback((state: BillsPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <BillsPageHeaderContext.Provider value={contextValue}>
      {children}
    </BillsPageHeaderContext.Provider>
  );
}

export function useBillsPageHeader() {
  const context = useContext(BillsPageHeaderContext);
  if (!context) {
    throw new Error('useBillsPageHeader must be used within BillsPageHeaderProvider');
  }
  return context;
}

