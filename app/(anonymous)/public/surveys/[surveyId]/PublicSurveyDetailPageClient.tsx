'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import type { SurveyDto } from '@/src/store/surveys';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import { ShareMenu } from '@/src/components/ui/ShareButton';
import Drawer from '@/src/components/overlays/Drawer';
import {
  PiClipboardText,
  PiArrowRight,
  PiQuestion,
  PiCheckCircle,
  PiXCircle,
  PiClock,
  PiCalendar,
  PiUser,
  PiInfo,
  PiShareNetwork,
} from 'react-icons/pi';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';

interface PublicSurveyDetailPageClientProps {
  surveyId: string;
  survey: SurveyDto | null;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'نامشخص';
  }
}

export default function PublicSurveyDetailPageClient({ surveyId, survey }: PublicSurveyDetailPageClientProps) {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const { isAuthenticated } = useAuth();
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !surveyId || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    router.replace(`/surveys/${surveyId}`);
  }, [isAuthenticated, surveyId, router]);

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(`/surveys/${surveyId}`);
    router.push(`/login?r=${returnUrl}`);
  };

  if (isAuthenticated) {
    return null;
  }

  if (!survey) {
    return null;
  }

  const isActive = survey.isActive === true;
  const isAcceptingResponses = survey.isAcceptingResponses === true;
  const isExpired = survey.isExpired === true;
  const isScheduled = survey.isScheduled === true;

  return (
    <ScrollableArea className="w-full" hideScrollbar>
      <div className="w-full space-y-4">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1 leading-6">
              سیستم رفاهی
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 leading-4">
              <PiClipboardText className="h-3.5 w-3.5" />
              <span>صفحه نظرسنجی</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogin}
              rightIcon={<PiArrowRight className="h-4 w-4" />}
              className="font-medium"
            >
              <span className="flex items-center gap-1.5">
                <PiUser className="h-3.5 w-3.5" />
                ورود
              </span>
            </Button>
          </div>
        </div>

        <Card variant="default" padding="md" radius="md" className="w-full">
          <div className="flex flex-col items-start gap-4 mb-4">
            <div className="flex-1 gap-2 flex flex-col w-full">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  نظرسنجی
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareDrawerOpen(true)}
                  leftIcon={<PiShareNetwork className="h-4 w-4" />}
                  className="text-gray-600 dark:text-gray-400"
                >
                  اشتراک‌گذاری
                </Button>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 leading-6">
                {survey.title || 'نظرسنجی'}
              </h2>
              {survey.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-6">
                  {survey.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isActive && isAcceptingResponses && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1.5">
                <PiCheckCircle className="h-3.5 w-3.5" />
                فعال و در حال دریافت پاسخ
              </span>
            )}
            {isScheduled && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1.5">
                <PiCalendar className="h-3.5 w-3.5" />
                زمان‌بندی شده
              </span>
            )}
            {isExpired && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 flex items-center gap-1.5">
                <PiXCircle className="h-3.5 w-3.5" />
                منقضی شده
              </span>
            )}
          </div>
        </Card>

        <Card variant="default" padding="md" radius="md" className="w-full">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 leading-5">
            اطلاعات نظرسنجی
          </h3>
          <div className="space-y-2.5">
            {survey.startAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <PiCalendar className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5 leading-4">
                    تاریخ شروع
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-5">
                    {formatDate(survey.startAt)}
                  </span>
                </div>
              </div>
            )}
            {survey.endAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <PiClock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5 leading-4">
                    تاریخ پایان
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-5">
                    {formatDate(survey.endAt)}
                  </span>
                </div>
              </div>
            )}
            {survey.totalQuestions !== undefined && survey.totalQuestions > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <PiQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5 leading-4">
                    تعداد سوالات
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-5">
                    {survey.totalQuestions} سوال
                    {survey.requiredQuestions !== undefined && survey.requiredQuestions > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400 mr-2 leading-4">
                        ({survey.requiredQuestions} سوال اجباری)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            {survey.maxAttemptsPerMember !== undefined && survey.maxAttemptsPerMember > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <PiCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5 leading-4">
                    حداکثر تلاش
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-5">
                    {survey.maxAttemptsPerMember} بار
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card variant="default" padding="md" radius="md" className="w-full">
          <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 leading-6">
                  برای پاسخ‌دهی به این نظرسنجی وارد شوید
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-6 mb-3">
                  این نظرسنجی نیاز به ورود به سیستم دارد. لطفاً وارد حساب کاربری خود شوید تا بتوانید به سوالات پاسخ دهید.
                </p>
                <div className="flex items-start gap-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-700 mb-3">
                  <PiInfo className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-5 flex-1">
                    <span className="font-semibold">نکته:</span> پس از ورود، به صفحه نظرسنجی هدایت می‌شوید و می‌توانید پاسخ‌های خود را ثبت کنید.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={handleLogin}
              rightIcon={<PiArrowRight className="h-5 w-5" />}
              shimmer
              className="font-semibold"
            >
              <span className="flex items-center justify-center gap-2">
                <PiUser className="h-4 w-4" />
                ورود به حساب کاربری
              </span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Share Drawer */}
      <Drawer
        open={shareDrawerOpen}
        onClose={setShareDrawerOpen}
        side="bottom"
        size="sm"
        rtlAware
      >
        <Drawer.Header>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            اشتراک‌گذاری نظرسنجی
          </h3>
        </Drawer.Header>
        <Drawer.Body>
          <ShareMenu
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={survey.title || 'نظرسنجی'}
            description={survey.description || undefined}
            onClose={() => setShareDrawerOpen(false)}
          />
        </Drawer.Body>
      </Drawer>
    </ScrollableArea>
  );
}

