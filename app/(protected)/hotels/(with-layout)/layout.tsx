'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HotelsPageHeaderProvider, useHotelsPageHeader } from './HotelsPageHeaderContext';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { PiBuildingsDuotone, PiCalendarCheck } from 'react-icons/pi';

interface HotelsLayoutProps {
  children: ReactNode;
}

function HotelsLayoutContent({ children }: HotelsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { headerState } = useHotelsPageHeader();

  const tabs = useMemo(
    () => [
      {
        id: 'hotels',
        label: 'هتل‌ها',
        icon: PiBuildingsDuotone,
        path: '/hotels',
        active: pathname === '/hotels' || pathname === '/hotels/',
      },
      {
        id: 'reservations',
        label: 'رزروها',
        icon: PiCalendarCheck,
        path: '/hotels/reservations',
        active:
          pathname.startsWith('/hotels/reservations') &&
          !pathname.includes('/reservations/'),
      },
    ],
    [pathname]
  );

  const handleTabClick = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  return (
    <>
      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #4b5563 #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .tab-item {
          transition: all 0.2s ease;
        }
        .tab-item:hover {
          transform: translateX(-2px);
        }
        .tab-item.active {
          background: #059669;
          color: white;
        }
        .tab-item:focus-visible {
          outline: 2px solid #059669;
          outline-offset: 2px;
        }
      `}</style>

      <div className="h-full flex flex-col" dir="rtl">
        {headerState.title && (
          <PageHeader
            title={headerState.title}
            titleIcon={headerState.titleIcon}
            subtitle={headerState.subtitle}
            showBackButton={headerState.showBackButton}
            onBack={headerState.onBack}
            rightActions={headerState.rightActions}
            leftActions={headerState.leftActions}
          />
        )}

        <div className="flex-1 flex flex-row overflow-hidden relative">
          <div className="flex-shrink-0 w-12 py-2 h-full">
            <div className="bg-white dark:bg-gray-800 border-l border-t border-b border-gray-200 dark:border-gray-700 rounded-tl-lg rounded-bl-lg overflow-hidden flex flex-col items-center gap-1 h-full">
              {tabs.map((tab) => {
                const isActive = tab.active;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.path)}
                    className={`tab-item relative w-full min-h-[90px] flex flex-col items-center justify-center gap-1 py-4 first:rounded-tl-sm ${
                      isActive
                        ? 'active bg-emerald-600 dark:bg-emerald-600'
                        : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={tab.label}
                    type="button"
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={`vertical-text text-xs font-medium whitespace-nowrap leading-tight ${
                        isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative w-full p-2">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default function HotelsLayout({ children }: HotelsLayoutProps) {
  return (
    <HotelsPageHeaderProvider>
      <HotelsLayoutContent>{children}</HotelsLayoutContent>
    </HotelsPageHeaderProvider>
  );
}
