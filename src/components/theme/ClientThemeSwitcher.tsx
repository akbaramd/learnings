'use client';

import { ThemeSwitcher } from './ThemeSwitcher';
import { useEffect, useState } from 'react';

interface ClientThemeSwitcherProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function ClientThemeSwitcher(props: ClientThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ThemeSwitcher {...props} />;
}
