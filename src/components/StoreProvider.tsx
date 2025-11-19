// src/app/providers.tsx
'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';

// Memoize to prevent unnecessary re-renders
const Providers = React.memo(function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
});

export default Providers;
