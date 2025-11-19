'use client';

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ClientThemeSwitcher } from "../../src/components/theme/ClientThemeSwitcher";

/**
 * Anonymous layout:
 * - Full-viewport flex column using dynamic viewport height for mobile browsers.
 * - Centered main area; only main can scroll if content overflows.
 * - Footer is pinned at the bottom and never pushes the page height.
 */
export default function AnonymousLayout({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Set viewport height dynamically to handle mobile browser UI
  // This ensures correct height calculation on page refresh
  useEffect(() => {
    const setViewportHeight = () => {
      if (containerRef.current) {
        // Use window.innerHeight for accurate mobile viewport height
        // This accounts for browser UI (address bar, etc.)
        const vh = window.innerHeight;
        containerRef.current.style.height = `${vh}px`;
        containerRef.current.style.maxHeight = `${vh}px`;
      }
    };

    // Set height immediately
    setViewportHeight();

    // Update on resize (handles browser UI changes)
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Also update after a short delay to catch late browser UI adjustments
    const timeoutId = setTimeout(setViewportHeight, 100);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className="flex flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-gray-800"
      style={{
        // Fallback to dvh, but JavaScript will override with exact pixel value
        height: '100dvh',
        maxHeight: '100dvh',
      }}
    >
      {/* MAIN: fills remaining space; is the only scroll container */}
      <div className="flex flex-col px-4 py-4 flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>

      {/* FOOTER: inside viewport bottom, with safe-area padding */}
      <div className="px-4 py-3 mt-auto border-t border-[var(--color-border)] dark:border-gray-700 text-[11px] sm:text-xs leading-4 text-neutral-500 dark:text-neutral-400 text-center pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/60 dark:bg-gray-800/60 backdrop-blur-[2px]">
        © ۲۰۲۵ گروه نرم‌افزاری بنیان — کلیه حقوق محفوظ است.
      </div>

      {/* Theme Switcher - positioned absolutely */}
      <ClientThemeSwitcher position="bottom-right" />
    </div>
  );
}

