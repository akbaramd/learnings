'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiHeadset } from 'react-icons/pi';
import { Button } from '@/src/components/ui/Button';

const RAYCHAT_URL = 'https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2';

export default function SupportPage() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to RayChat URL immediately
    window.location.href = RAYCHAT_URL;
  }, []);

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleOpenChat = () => {
    window.open(RAYCHAT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="پشتیبانی"
        titleIcon={<PiHeadset className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        subtitle="در صورت نیاز به کمک، با ما در تماس باشید"
        showBackButton
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4">
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <PiHeadset className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              در حال انتقال به چت پشتیبانی...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              در حال انتقال به صفحه چت آنلاین پشتیبانی هستید.
            </p>
            <Button
              variant="solid"
              color="primary"
              size="md"
              onClick={handleOpenChat}
              leftIcon={<PiHeadset className="h-5 w-5" />}
            >
              باز کردن چت پشتیبانی
            </Button>
          </div>
        </div>
      </ScrollableArea>
    </div>
  );
}

