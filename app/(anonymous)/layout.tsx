import type { ReactNode } from "react";
import { ClientThemeSwitcher } from "../../src/components/theme/ClientThemeSwitcher";

/**
 * Anonymous layout:
 * - Full-viewport flex column using 100vh to avoid mobile toolbar jumps.
 * - Centered main area; only main can scroll if content overflows.
 * - Footer is pinned at the bottom and never pushes the page height.
 */
export default function AnonymousLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-gray-800"
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

