'use client';

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { PiHeadset } from "react-icons/pi";
import { ClientThemeSwitcher } from "../../src/components/theme/ClientThemeSwitcher";

/**
 * Auth layout:
 * - Full-viewport flex column using dynamic viewport height for mobile browsers.
 * - Centered main area; only main can scroll if content overflows.
 * - Footer is pinned at the bottom and never pushes the page height.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
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
      className="flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{
        // Fallback to dvh, but JavaScript will override with exact pixel value
        height: '100dvh',
        maxHeight: '100dvh',
      }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl opacity-20 bg-emerald-400 dark:bg-emerald-500" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-20 bg-blue-400 dark:bg-blue-500" />
      </div>

      {/* MAIN: fills remaining space; is the only scroll container */}
      <div className="relative flex items-center justify-center flex-1 min-h-0">
        {/* Card container - centered and constrained */}
        <div className="w-full">
          {children}
        </div>
      </div>

      {/* FOOTER: inside viewport bottom, with safe-area padding */}
      <div className="px-4 py-3 mt-auto border-t border-[var(--color-border)] dark:border-gray-700 text-[11px] sm:text-xs leading-4 text-neutral-500 dark:text-neutral-400 text-center pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/60 dark:bg-gray-800/60 backdrop-blur-[2px]">
        © ۲۰۲۵ گروه نرم‌افزاری بنیان — کلیه حقوق محفوظ است.
      </div>

      {/* Theme Switcher - positioned absolutely */}
      <ClientThemeSwitcher position="bottom-right" />

      {/* Support Button - enhanced with text for better discoverability */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => window.open('https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2', '_blank', 'noopener,noreferrer')}
          className="group flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          aria-label="پشتیبانی آنلاین"
          title="پشتیبانی آنلاین - کلیک کنید"
        >
          <PiHeadset className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
            پشتیبانی آنلاین
          </span>
          <span className="text-sm font-medium whitespace-nowrap sm:hidden">
            پشتیبانی
          </span>
        </button>

        {/* Tooltip for mobile users */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          کلیک کنید تا با پشتیبانی تماس بگیرید
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      </div>
    </div>
  );
}
