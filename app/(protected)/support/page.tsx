'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { PiHeadset } from 'react-icons/pi';

const RAYCHAT_URL = 'https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2';

export default function SupportPage() {
  const router = useRouter();

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleIframeLoad = () => {
    console.log('RayChat iframe loaded');
  };

  const handleIframeError = () => {
    console.log('RayChat iframe error');
  };

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title="پشتیبانی آنلاین"
        titleIcon={<PiHeadset className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        subtitle="در صورت نیاز به کمک، با تیم پشتیبانی چت کنید"
        showBackButton
        onBack={handleBack}
      />

      <div className="flex-1">
        <iframe
          src={RAYCHAT_URL}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="پشتیبانی آنلاین RayChat"
          allow="microphone; camera; geolocation"
        />
      </div>
    </div>
  );
}

