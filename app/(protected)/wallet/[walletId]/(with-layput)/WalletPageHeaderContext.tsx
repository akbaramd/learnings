'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { PageHeaderProps } from '@/src/components/ui/PageHeader';

interface WalletPageHeaderState extends Partial<PageHeaderProps> {
  isLoading?: boolean;
}

interface WalletPageHeaderContextType {
  headerState: WalletPageHeaderState;
  setHeaderState: (state: WalletPageHeaderState) => void;
}

const WalletPageHeaderContext = createContext<WalletPageHeaderContextType | undefined>(undefined);

export function WalletPageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerState, setHeaderState] = useState<WalletPageHeaderState>({});

  const updateHeaderState = useCallback((state: WalletPageHeaderState) => {
    setHeaderState((prev) => ({ ...prev, ...state }));
  }, []);

  const contextValue = useMemo(() => ({
    headerState,
    setHeaderState: updateHeaderState,
  }), [headerState, updateHeaderState]);

  return (
    <WalletPageHeaderContext.Provider value={contextValue}>
      {children}
    </WalletPageHeaderContext.Provider>
  );
}

export function useWalletPageHeader() {
  const context = useContext(WalletPageHeaderContext);
  if (!context) {
    throw new Error('useWalletPageHeader must be used within WalletPageHeaderProvider');
  }
  return context;
}

