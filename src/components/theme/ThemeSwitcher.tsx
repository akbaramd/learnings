'use client';

import { IconButton } from '../ui/IconButton';
import { useTheme } from '@/src/hooks/useTheme';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

interface ThemeSwitcherProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function ThemeSwitcher({ 
  position = 'bottom-right', 
  className = '' 
}: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme();

  const positionClasses = {
    'bottom-left': 'fixed bottom-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'top-right': 'fixed top-4 right-4',
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <FiSun className="text-yellow-500" />;
      case 'dark':
        return <FiMoon className="text-gray-700 dark:text-gray-300" />;
      case 'system':
        return <FiMonitor className="text-blue-500" />;
      default:
        return <FiSun className="text-yellow-500" />;
    }
  };

  const getAriaLabel = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system theme';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <div className={`${positionClasses[position]} z-50 ${className}`}>
      <IconButton
        onClick={toggleTheme}
        variant="ghost"
        size="md"
        radius="md"
        aria-label={getAriaLabel()}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 shadow-lg"
      >
        {getIcon()}
      </IconButton>
    </div>
  );
}

export default ThemeSwitcher;
