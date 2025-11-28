'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { TutorialCard, Tutorial } from '@/src/components/tutorials/TutorialCard';
import { PiBookOpen } from 'react-icons/pi';

// Tutorials data
const tutorials: Tutorial[] = [
  {
    id: 'facility-tutorial',
    title: 'آموزش درخواست تسهیلات',
    description: 'راهنمای کامل نحوه ثبت درخواست تسهیلات و پیگیری وضعیت آن',
    videoSrc: '/video/facilities.mp4',
    category: 'facility' as const,
    icon: <PiBookOpen className="h-6 w-6" />,
    accentColor: 'emerald' as const,
  },
  {
    id: 'survey-tutorial',
    title: 'آموزش شرکت در نظرسنجی',
    description: 'راهنمای کامل نحوه شرکت در نظرسنجی‌ها و پاسخ به سوالات',
    videoSrc: '/video/survey.mp4',
    category: 'survey' as const,
    icon: <PiBookOpen className="h-6 w-6" />,
    accentColor: 'amber' as const,
  },
];

export default function TutorialsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <style jsx>{`
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
      `}</style>
      <div className="h-full flex flex-col" dir="rtl">
        {/* Page Header */}
        <PageHeader
          title="آموزش‌ها"
          titleIcon={<PiBookOpen className="h-5 w-5" />}
          subtitle={`${tutorials.length} آموزش`}
          showBackButton={true}
          onBack={handleBack}
        />

        {/* Content */}
        <ScrollableArea className="flex-1 custom-scrollbar">
          <div className="p-4 pb-2">
            {tutorials.length === 0 ? (
              <div className="text-center py-12">
                <PiBookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  آموزشی موجود نیست
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  در حال حاضر آموزشی برای نمایش وجود ندارد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tutorials.map((tutorial) => (
                  <TutorialCard
                    key={tutorial.id}
                    tutorial={tutorial}
                    dir="rtl"
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollableArea>
      </div>
    </>
  );
}
