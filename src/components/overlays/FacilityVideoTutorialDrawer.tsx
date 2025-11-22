'use client';

import { ReactNode } from 'react';
import Drawer from './Drawer';
import Button from '@/src/components/ui/Button';
import {
  PiVideo,
  PiInfo,
  PiArrowRight,
  PiMoney,
} from 'react-icons/pi';

interface FacilityVideoTutorialDrawerProps {
  open: boolean;
  onClose: (open: boolean) => void;
  videoSrc?: string;
  title?: string;
  subtitle?: string;
  showRequestButton?: boolean;
  onRequestClick?: () => void;
  requestButtonText?: string;
  children?: ReactNode;
}

export default function FacilityVideoTutorialDrawer({
  open,
  onClose,
  videoSrc = '/video/facilities.mp4',
  title = 'آموزش ویدویی سیستم تسهیلات',
  subtitle = 'راهنمای استفاده از سیستم درخواست تسهیلات',
  showRequestButton = false,
  onRequestClick,
  requestButtonText = 'ثبت درخواست تسهیلات',
  children,
}: FacilityVideoTutorialDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      size="lg"
      rtlAware
    >
      <Drawer.Header>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <PiVideo className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      </Drawer.Header>
      <Drawer.Body className="p-0">
        <div className="w-full bg-black">
          <video
            className="w-full h-auto max-h-[60vh]"
            controls
            controlsList="nodownload"
            preload="metadata"
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
            <p className="text-white p-4 text-center">
              مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
            </p>
          </video>
        </div>
        <div className="p-4 space-y-3">
          {children || (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <PiInfo className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  نکات مهم
                </h4>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 leading-5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>این ویدئو راهنمای کامل استفاده از سیستم درخواست تسهیلات را ارائه می‌دهد.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>برای بهترین تجربه، ویدئو را در حالت تمام صفحه تماشا کنید.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>پس از تماشای ویدئو، می‌توانید با کلیک روی دکمه ثبت درخواست، شروع به ثبت درخواست تسهیلات کنید.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                    <span>اطمینان حاصل کنید که تمام شرایط و مدارک مورد نیاز را مطالعه کرده‌اید.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          {showRequestButton && onRequestClick && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="solid"
                size="md"
                onClick={onRequestClick}
                rightIcon={<PiArrowRight className="h-4 w-4" />}
                className="font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <PiMoney className="h-4 w-4" />
                  {requestButtonText}
                </span>
              </Button>
            </div>
          )}
        </div>
      </Drawer.Body>
    </Drawer>
  );
}

