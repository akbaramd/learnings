'use client';

import { useEffect, useState } from 'react';
import { 
  PiDownload, 
  PiDeviceMobile, 
  PiCheckCircle, 
  PiArrowRight,
  PiAppWindow,
  PiSparkle
} from 'react-icons/pi';
import { Button } from '@/src/components/ui/Button';
import Drawer from '@/src/components/overlays/Drawer';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const STORAGE_KEY = 'pwa-install-prompt-dismissed';
const STORAGE_TIMESTAMP_KEY = 'pwa-install-prompt-dismissed-timestamp';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      console.log('[PWA Install] Checking if app is already installed...');
      
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      console.log('[PWA Install] Standalone mode:', isStandalone);
      
      if (isStandalone) {
        console.log('[PWA Install] App is installed (standalone mode detected)');
        setIsInstalled(true);
        return true;
      }

      // Check if running from home screen on iOS
      const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
      const isIOSStandalone = navigatorWithStandalone.standalone === true;
      console.log('[PWA Install] iOS standalone:', isIOSStandalone);
      
      if (isIOSStandalone) {
        console.log('[PWA Install] App is installed (iOS standalone detected)');
        setIsInstalled(true);
        return true;
      }

      console.log('[PWA Install] App is not installed');
      return false;
    };

    if (checkIfInstalled()) {
      return;
    }

    // Check if user has dismissed the prompt recently
    const checkDismissed = () => {
      console.log('[PWA Install] Checking if prompt was dismissed...');
      const dismissed = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      if (dismissed === 'true' && timestamp) {
        const dismissedTime = parseInt(timestamp, 10);
        const now = Date.now();
        const timeSinceDismiss = now - dismissedTime;
        
        console.log('[PWA Install] Dismissed timestamp:', new Date(dismissedTime).toISOString());
        console.log('[PWA Install] Time since dismiss:', Math.floor(timeSinceDismiss / (1000 * 60 * 60)), 'hours');
        
        // If dismissed less than DISMISS_DURATION ago, don't show
        if (timeSinceDismiss < DISMISS_DURATION) {
          console.log('[PWA Install] Prompt was recently dismissed, not showing');
          return true;
        } else {
          // Dismissal expired, clear it
          console.log('[PWA Install] Dismissal expired, clearing storage');
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      } else {
        console.log('[PWA Install] No previous dismissal found');
      }
      
      return false;
    };

    if (checkDismissed()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA Install] beforeinstallprompt event received');
      // Prevent the default browser install prompt
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('[PWA Install] Deferred prompt stored, will show in 3 seconds');
      
      // Show our custom prompt after a delay (better UX)
      setTimeout(() => {
        console.log('[PWA Install] Showing install prompt');
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Install] App installed event received');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Clear dismissal state since app is now installed
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      console.log('[PWA Install] Install prompt hidden and storage cleared');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    console.log('[PWA Install] Install button clicked');
    if (!deferredPrompt) {
      console.warn('[PWA Install] No deferred prompt available');
      return;
    }

    setIsInstalling(true);
    console.log('[PWA Install] Showing browser install prompt...');

    try {
      // Show the browser install prompt
      await deferredPrompt.prompt();
      console.log('[PWA Install] Browser prompt shown, waiting for user choice...');

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA Install] User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA Install] User accepted the install prompt');
        setIsInstalled(true);
        setShowPrompt(false);
      } else {
        console.log('[PWA Install] User dismissed the install prompt');
        handleDismiss();
      }
    } catch (error) {
      console.error('[PWA Install] Error showing install prompt:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    console.log('[PWA Install] User dismissed the prompt');
    setShowPrompt(false);
    // Store dismissal in localStorage
    const timestamp = Date.now();
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, timestamp.toString());
    console.log('[PWA Install] Dismissal saved to localStorage, timestamp:', new Date(timestamp).toISOString());
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      handleDismiss();
    }
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Drawer
      open={showPrompt}
      onClose={handleClose}
      side="bottom"
      size="lg"
      rtlAware
      closeOnBackdrop={true}
      closeOnEsc={true}
    >
      <Drawer.Header>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <PiDeviceMobile className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              نصب اپلیکیشن
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              اپلیکیشن را روی دستگاه خود نصب کنید
            </p>
          </div>
        </div>
      </Drawer.Header>

      <Drawer.Body className="p-0">
        <div className="p-4 space-y-4">
          {/* Hero Section */}
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 mb-4">
              <PiAppWindow className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              دسترسی سریع‌تر و راحت‌تر
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              با نصب اپلیکیشن، آیکون آن در صفحه اصلی دستگاه شما نمایش داده می‌شود و می‌توانید به راحتی به آن دسترسی داشته باشید.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <PiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  دسترسی سریع از صفحه اصلی
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  آیکون اپلیکیشن در صفحه اصلی دستگاه شما نمایش داده می‌شود و با یک کلیک می‌توانید به آن دسترسی پیدا کنید.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <PiCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  کار آفلاین
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  حتی بدون اتصال به اینترنت می‌توانید از بخش‌های مختلف اپلیکیشن استفاده کنید.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <PiCheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  تجربه بهتر
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  عملکرد سریع‌تر، بارگذاری بهتر و تجربه کاربری مشابه اپلیکیشن‌های موبایل.
                </p>
              </div>
            </div>
          </div>

          {/* After Install Info */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <PiSparkle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  پس از نصب
                </h5>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>آیکون اپلیکیشن در صفحه اصلی دستگاه شما نمایش داده می‌شود</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>می‌توانید از طریق آیکون مستقیماً به اپلیکیشن دسترسی داشته باشید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>اپلیکیشن به صورت مستقل اجرا می‌شود و تجربه بهتری ارائه می‌دهد</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Drawer.Body>

      <Drawer.Footer>
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="solid"
            color="primary"
            size="md"
            onClick={handleInstall}
            disabled={isInstalling}
            loading={isInstalling}
            leftIcon={<PiDownload className="h-5 w-5" />}
            rightIcon={<PiArrowRight className="h-4 w-4" />}
            className="flex-1 font-medium"
            block
          >
            {isInstalling ? 'در حال نصب...' : 'نصب اپلیکیشن'}
          </Button>
        </div>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          می‌توانید بعداً از منوی مرورگر نیز نصب کنید
        </p>
      </Drawer.Footer>
    </Drawer>
  );
}

