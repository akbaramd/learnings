'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SurveysPageHeaderProvider, useSurveysPageHeader } from './SurveysPageHeaderContext';
import { PageHeader } from '@/src/components/ui/PageHeader';
import {
  PiClipboardText,
  PiFileText,
} from 'react-icons/pi';

interface SurveysLayoutProps {
  children: React.ReactNode;
}

function SurveysLayoutContent({ children }: SurveysLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { headerState } = useSurveysPageHeader();

  // Define navigation tabs
  const tabs = useMemo(() => [
    {
      id: 'surveys',
      label: 'نظرسنجی‌ها',
      icon: PiClipboardText,
      path: '/surveys',
      active: pathname === '/surveys' || pathname === '/surveys/',
    },
    {
      id: 'responses',
      label: 'پاسخ‌ها',
      icon: PiFileText,
      path: '/surveys/responses',
      active: pathname.startsWith('/surveys/responses') && !pathname.includes('/responses/'),
    },
  ], [pathname]);

  const handleTabClick = (path: string) => {
    router.push(path);
  };

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
          scrollbar-color: #9CA3AF #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9CA3AF;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #4B5563 #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        .tab-item {
          transition: all 0.2s ease;
        }
        .tab-item:hover {
          transform: translateX(-2px);
        }
        .tab-item.active {
          background: #2563EB;
          color: white;
        }
        .tab-item:focus-visible {
          outline: 2px solid #2563EB;
          outline-offset: 2px;
        }
      `}</style>
      <div className="h-full flex flex-col" dir="rtl">
        {/* PageHeader - Above navigation and content */}
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
        
        {/* Content with Vertical Tabs */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          {/* Vertical Tabs Navigation - Sticky on left side, with margins */}
          <div className="flex-shrink-0 w-12 self-start top-0 py-2 h-full">
            <div className="bg-white dark:bg-gray-800 border-l border-t border-b border-gray-200 dark:border-gray-700 rounded-tl-lg rounded-bl-lg overflow-hidden flex flex-col items-center gap-1 h-full shadow-sm">
              {tabs.map((tab) => {
                const isActive = tab.active;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.path)}
                    className={`tab-item relative w-full min-h-[90px] flex flex-col items-center justify-center gap-1 py-4 transition-all first:rounded-tl-sm ${
                      isActive
                        ? 'active bg-blue-600 dark:bg-blue-600'
                        : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={tab.label}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={`vertical-text text-xs font-medium whitespace-nowrap leading-tight ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400'
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

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden relative w-full p-2">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SurveysLayout({ children }: SurveysLayoutProps) {
  return (
    <SurveysPageHeaderProvider>
      <SurveysLayoutContent>
        {children}
      </SurveysLayoutContent>
    </SurveysPageHeaderProvider>
  );
}

