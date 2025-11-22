'use client';

import { useEffect, useState } from 'react';
import { PiDownload, PiX, PiDeviceMobile, PiCheckCircle } from 'react-icons/pi';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';

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

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <Card
        variant="default"
        radius="lg"
        padding="md"
        className="bg-white dark:bg-gray-800 border-2 border-emerald-500 dark:border-emerald-400 shadow-lg"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <PiDeviceMobile className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              نصب اپلیکیشن
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              این اپلیکیشن را روی دستگاه خود نصب کنید تا دسترسی سریع‌تر و تجربه بهتری داشته باشید.
            </p>

            {/* Benefits */}
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
              <li className="flex items-center gap-2">
                <PiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>دسترسی سریع‌تر</span>
              </li>
              <li className="flex items-center gap-2">
                <PiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>کار آفلاین</span>
              </li>
              <li className="flex items-center gap-2">
                <PiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>تجربه بهتر</span>
              </li>
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="solid"
                color="primary"
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                loading={isInstalling}
                leftIcon={<PiDownload className="h-4 w-4" />}
                className="flex-1"
              >
                {isInstalling ? 'در حال نصب...' : 'نصب اپلیکیشن'}
              </Button>
              <Button
                variant="subtle"
                size="sm"
                onClick={handleDismiss}
                className="px-3"
                aria-label="بستن"
              >
                <PiX className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

