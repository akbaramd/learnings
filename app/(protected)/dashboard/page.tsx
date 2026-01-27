'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useSession } from 'next-auth/react';
import { IconButton } from '@/src/components/ui/IconButton';
import { selectUser, selectUserName, useGetMeQuery } from '@/src/store/auth';
import { PiEye, PiEyeSlash, PiGear, PiArrowClockwise, PiHeart, PiBell, PiSun, PiMoon } from 'react-icons/pi';
import { ServicesGrid } from '@/src/components/services/ServiceCard';
import { TourSection } from '@/src/components/tours/TourSection';
import { Tour, TourCardSkeleton } from '@/src/components/tours/TourCard';
import { FacilitySection } from '@/src/components/facilities/FacilitySection';
import { Facility, FacilityCardSkeleton } from '@/src/components/facilities/FacilityCard';
import { SurveySection } from '@/src/components/surveys/SurveySection';
import { Survey, SurveyCardSkeleton } from '@/src/components/surveys/SurveyCard';
import { TutorialSection } from '@/src/components/tutorials';
import { Tutorial } from '@/src/components/tutorials/TutorialCard';
import { PiMoney, PiFileText, PiHouseSimple, PiInfo, PiWallet, PiCalendar } from 'react-icons/pi';
import { useGetToursPaginatedQuery } from '@/src/store/tours/tours.queries';
import { useGetFacilitiesQuery } from '@/src/store/facilities';
import { useGetActiveSurveysQuery } from '@/src/store/surveys';
import { selectWallet, selectWalletLastFetched } from '@/src/store/wallets';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { buildImageUrl } from '@/src/config/env';
import { useState, useEffect } from 'react';

/* =========================
   Wallet Helper Functions
========================= */

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) return '۰';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? 0);
  }
}

function formatRelativeFa(date: Date | string | null) {
  if (!date) return 'نامشخص';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'نامشخص';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'هم‌اکنون';
  if (min < 60) return `${min} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ساعت پیش`;
  return `${Math.floor(hr / 24)} روز پیش`;
}

/* =========================
   WalletCardSkeleton
========================= */
function WalletCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm animate-pulse">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-24 bg-emerald-500/50 rounded" />
        <div className="h-8 w-8 bg-emerald-500/50 rounded" />
      </div>
      <div className="mb-1 h-8 w-40 bg-emerald-500/50 rounded" />
      <div className="mb-4 h-4 w-32 bg-emerald-500/50 rounded" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-emerald-500/50 rounded-md" />
        <div className="h-10 bg-emerald-500/50 rounded-md" />
      </div>
    </div>
  );
}

/* =========================
   WalletCard
========================= */
function WalletCard() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchWallet } = useLazyWallets();
  const wallet = useSelector(selectWallet);
  const lastFetched = useSelector(selectWalletLastFetched);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchWallet();
      } catch {
        setError('خطا در بارگذاری موجودی کیف پول');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchWallet]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchWallet();
    } catch {
      setError('خطا در بروزرسانی موجودی کیف پول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageWallet = () => {
    router.push(`/wallet/${wallet?.id ?? 'default'}`);
  };

  const balance = wallet?.balance ?? 0;
  const lastUpdate = wallet?.lastUpdated || lastFetched;

  if (isLoading && !wallet) {
    return <WalletCardSkeleton />;
  }

  return (
    <div className="rounded-3xl p-4 shadow-2xl border relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-500/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative">
        {/* Header with icons */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-emerald-100 text-sm flex items-center gap-2">
            <PiWallet className="w-4 h-4" />
            کیف پول اصلی
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setHidden(v => !v)}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            >
              {hidden ? (
                <PiEye className="w-3.5 h-3.5 text-white" />
              ) : (
                <PiEyeSlash className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <PiArrowClockwise className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Centered Balance */}
        <div className="text-center mb-3">
          <h2 className="text-2xl font-bold text-white">
            {isLoading && !wallet ? 'در حال بارگذاری...' : hidden ? '•••••' : (
              <>
                {formatCurrencyFa(balance)} <span className="text-lg font-normal text-emerald-100">ریال</span>
              </>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-emerald-100 text-xs">
            آخرین بروزرسانی: {formatRelativeFa(lastUpdate)}
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-500/20 p-2 text-xs text-red-100">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={handleRefresh} className="text-xs underline hover:no-underline">
                تلاش مجدد
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleManageWallet}
            className="flex-1 py-2 bg-white text-emerald-600 rounded-lg text-sm flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors active:scale-95"
          >
            <PiGear className="w-4 h-4" />
            مدیریت
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-1 py-2 bg-white/10 text-white rounded-lg text-sm flex items-center justify-center gap-1.5 hover:bg-white/20 transition-colors active:scale-95 disabled:opacity-50"
          >
            <PiArrowClockwise className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Service Cards (Static)
========================= */

const services = [
  {
    id: 'facility',
    title: 'تسهیلات مالی',
    icon: PiWallet,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500',
    disabled: false
  },
  {
    id: 'tour',
    title: 'تور و رویداد',
    icon: PiCalendar,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500',
    disabled: false
  },
  {
    id: 'survey',
    title: 'نظرسنجی',
    icon: PiFileText,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500',
    disabled: false
  },
  {
    id: 'hotels',
    title: 'اسکان و هتل',
    icon: PiHouseSimple,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-500',
    disabled: false
  },
];

/* =========================
   Tours Loader + Mapper
========================= */

function useToursList(): { tours: Tour[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useGetToursPaginatedQuery({
    pageNumber: 1,
    pageSize: 3,
    isActive: true,
  });

  const tours: Tour[] = useMemo(() => {
    if (!data?.data?.items) return [];
    return data.data.items.map((t) => ({
      id: t.id || '',
      title: t.title || 'بدون عنوان',
      description: t.title ?? '',
      photos: t.photos?.map((p) => (p.url ? buildImageUrl(p.url) : '')) ?? [],
      isRegistrationOpen: t.isRegistrationOpen ?? false,
      difficultyLevel: 1,
      price: t.pricing?.[0]?.effectivePriceRials ?? t.lowestPriceRials ?? 0,
      registrationStart: t.registrationStart ?? '',
      registrationEnd: t.registrationEnd ?? '',
      tourStart: t.tourStart ?? '',
      tourEnd: t.tourEnd ?? '',
      maxCapacity: t.maxCapacity ?? 0,
      remainingCapacity: t.remainingCapacity ?? 0,
      reservationId: t.reservation?.id ?? null,
      reservationStatus: t.reservation?.status ?? null,
      gender: t.gender ?? null,
      genderText: t.genderText ?? null,
    } as Tour));
  }, [data]);

  return { tours, isLoading, isError };
}

/* =========================
   Facilities Loader + Mapper
========================= */

function useFacilitiesList(): { facilities: Facility[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useGetFacilitiesQuery({
    pageNumber: 1,
    pageSize: 3,
    isActive: true,
  });

  const facilities: Facility[] = useMemo(() => {
    if (!data?.data?.items) return [];
    return data.data.items.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      description: f.description,
      hasActiveCycles: f.hasActiveCycles,
      isAcceptingApplications: f.isAcceptingApplications,
      cycleStatistics: f.cycleStatistics ? {
        totalActiveQuota: f.cycleStatistics.totalActiveQuota,
        totalAvailableQuota: f.cycleStatistics.totalAvailableQuota,
        totalCyclesCount: f.cycleStatistics.totalCyclesCount,
      } : undefined,
    } as Facility));
  }, [data]);

  return { facilities, isLoading, isError };
}

/* =========================
   Surveys Loader + Mapper
========================= */

function useSurveysList(): { surveys: Survey[]; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useGetActiveSurveysQuery({
    pageNumber: 1,
    pageSize: 3,
  });

  const surveys: Survey[] = useMemo(() => {
    if (!data?.data?.surveys) return [];
    return data.data.surveys.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      state: s.state,
      stateText: s.stateText,
      isActive: s.isActive,
      isAcceptingResponses: s.isAcceptingResponses,
      startAt: s.startAt,
      endAt: s.endAt,
      totalQuestions: s.totalQuestions,
      requiredQuestions: s.requiredQuestions,
      hasUserResponse: s.hasUserResponse,
      canUserParticipate: s.canUserParticipate,
      userAttemptCount: s.userAttemptCount,
      remainingAttempts: s.remainingAttempts,
      responseCount: s.responseCount,
      durationText: s.durationText,
      timeRemainingText: s.timeRemainingText,
      isExpired: s.isExpired,
      isScheduled: s.isScheduled,
    } as Survey));
  }, [data]);

  return { surveys, isLoading, isError };
}

/* =========================
   Tutorials Data
========================= */

// Tutorials data for dashboard preview
const tutorials: Tutorial[] = [
  {
    id: 'facility-tutorial',
    title: 'آموزش درخواست تسهیلات',
    description: 'راهنمای کامل نحوه ثبت درخواست تسهیلات و پیگیری وضعیت آن',
    videoSrc: '/video/facilities.mp4',
    category: 'facility' as const,
    icon: <PiMoney className="h-6 w-6" />,
    accentColor: 'emerald' as const,
  },
  {
    id: 'survey-tutorial',
    title: 'آموزش شرکت در نظرسنجی',
    description: 'راهنمای کامل نحوه شرکت در نظرسنجی‌ها و پاسخ به سوالات',
    videoSrc: '/video/survey.mp4',
    category: 'survey' as const,
    icon: <PiFileText className="h-6 w-6" />,
    accentColor: 'amber' as const,
  },
];

/* =========================
   Page (Final)
========================= */

export default function HomeDashboard() {
  const { tours, isLoading: toursLoading, isError: toursError } = useToursList();
  const { facilities, isLoading: facilitiesLoading, isError: facilitiesError } = useFacilitiesList();
  const { surveys, isLoading: surveysLoading, isError: surveysError } = useSurveysList();
  const { data: session, status } = useSession();
  const user = useSelector(selectUser);
  const userName = useSelector(selectUserName);
  const { data: member } = useGetMeQuery();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;

  // Fetch user profile when authenticated (same as profile page)
  useGetMeQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const displayName = userName || user?.firstName || session?.user?.name || 'کاربر';

  function handleServiceSelect(id: string): void {
    if (id === 'facility') {
      router.push('/facilities');
    } else if (id === 'tour') {
      router.push('/tours');
    }else if (id === 'hotels') {
      router.push('/hotels');
    }
    else if (id === 'survey') {
      router.push('/surveys');
    }
  }

  return (
    <div
      className="min-h-screen pb-6 transition-colors duration-300 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      dir="rtl"
    >
      {/* Header with Gradient */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-white/95 to-white/80 dark:from-slate-900/95 dark:to-slate-900/80 backdrop-blur-xl">
        <div className="px-4 pt-8 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <PiHeart className="w-5 h-5 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-base text-gray-900 dark:text-white">
                  سلام {displayName} 👋
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  به سامانه رفاهی خوش آمدید
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-4">
        {/* Wallet */}
        <section>
          <WalletCard />
        </section>

            {/* Services */}
            <section className="">
              <div className="mb-3 px-1">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">خدمات</h2>
              </div>
              <ServicesGrid items={services} onSelect={handleServiceSelect} />
            </section>

            {/* Tutorials Section */}
            <section className="">
              <TutorialSection 
                title="آموزش‌ها" 
                seeAllHref="/tutorials"
                dir="rtl" 
                tutorials={tutorials}
                isLoading={false}
              />
            </section>

            {/* Tours Section */}
            <section className=" my-6">
              {toursError && <div className="text-center text-red-600 py-6">خطا در دریافت اطلاعات تور و رویدادها</div>}
              {toursLoading ? (
                <div className="space-y-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="flex-shrink-0 w-[90vw] max-w-[320px]">
                        <TourCardSkeleton />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !toursError && <TourSection seeAllHref="/tours" title="تور و رویدادها" dir="rtl" tours={tours} />
              )}
            </section>

            {/* Future Services Alert */}
            <section className=" my-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <PiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      سرویس‌های جدید در راه است
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      سرویس‌های جدیدی در آینده به این قسمت اضافه خواهد شد. برای اطلاع از آخرین به‌روزرسانی‌ها، صفحه را دنبال کنید.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Facilities Section */}
            <section className=" my-6">
              {facilitiesError && <div className="text-center text-red-600 py-6">خطا در دریافت اطلاعات تسهیلات</div>}
              {facilitiesLoading ? (
                <div className="space-y-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <FacilityCardSkeleton key={idx} dir="rtl" />
                    ))}
                  </div>
                </div>
              ) : (
                !facilitiesError && (
                  <FacilitySection seeAllHref="/facilities" title="تسهیلات" dir="rtl" facilities={facilities} />
                )
              )}
            </section>

            {/* Surveys Section */}
            <section className=" my-6">
              {surveysError && <div className="text-center text-red-600 py-6">خطا در دریافت اطلاعات نظرسنجی‌ها</div>}
              {surveysLoading ? (
                <div className="space-y-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <SurveyCardSkeleton key={idx} dir="rtl" />
                    ))}
                  </div>
                </div>
              ) : (
                !surveysError && (
                  <SurveySection seeAllHref="/surveys" title="نظرسنجی‌ها" dir="rtl" surveys={surveys} />
                )
              )}
            </section>
      </div>
    </div>
  );
}
