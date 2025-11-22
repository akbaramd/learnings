'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiHeadset } from 'react-icons/pi';
import { Button } from '@/src/components/ui/Button';

export default function SupportPage() {
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Load RayChat widget script
    if (scriptLoadedRef.current) return;

    const scriptId = 'raychat-widget-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      scriptLoadedRef.current = true;
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = 'https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('RayChat widget loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load RayChat widget');
      scriptLoadedRef.current = false;
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts (optional)
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleOpenChat = () => {
    // Fallback: open in new window/tab
    window.open('https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2', '_blank', 'noopener,noreferrer');
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
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              پشتیبانی آنلاین
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              برای ارتباط با تیم پشتیبانی، از طریق چت آنلاین با ما در تماس باشید. 
              ما آماده پاسخگویی به سوالات و حل مشکلات شما هستیم.
            </p>
          </div>

          {/* Chat Widget Container */}
          <div 
            ref={chatContainerRef}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 min-h-[500px] flex items-center justify-center"
          >
            <div className="text-center p-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <PiHeadset className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  چت آنلاین پشتیبانی
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  ویجت چت در حال بارگذاری است...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  اگر ویجت نمایش داده نمی‌شود، روی دکمه زیر کلیک کنید
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
          </div>

          {/* Alternative: Direct Link */}
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <PiHeadset className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  دسترسی مستقیم به چت
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                  می‌توانید از طریق لینک زیر مستقیماً به صفحه چت پشتیبانی دسترسی پیدا کنید:
                </p>
                <a
                  href="https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                >
                  https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ساعات پاسخگویی
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              تیم پشتیبانی ما در ساعات اداری (شنبه تا پنج‌شنبه، ۹ صبح تا ۵ عصر) آماده پاسخگویی به شماست.
            </p>
          </div>
        </div>
      </ScrollableArea>

      {/* Load RayChat Script */}
      <Script
        id="raychat-widget"
        strategy="afterInteractive"
        src="https://widget.raychat.io/5d259dc6961e95bd413e1358?version=2"
        onLoad={() => {
          console.log('RayChat script loaded');
        }}
        onError={() => {
          console.error('Failed to load RayChat script');
        }}
      />
    </div>
  );
}

