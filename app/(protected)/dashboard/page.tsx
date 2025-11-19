'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IconButton } from '@/src/components/ui/IconButton';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiEye, PiEyeSlash, PiGear, PiArrowClockwise, PiMapPinDuotone, PiMoney, PiFileText, PiDiamondDuotone, PiShieldCheck, PiTruck } from 'react-icons/pi';
import { ServicesGrid } from '@/src/components/services/ServiceCard';
import { TourSection } from '@/src/components/tours/TourSection';
import { Tour, TourCardSkeleton } from '@/src/components/tours/TourCard';
import { FacilitySection } from '@/src/components/facilities/FacilitySection';
import { Facility, FacilityCardSkeleton } from '@/src/components/facilities/FacilityCard';
import { SurveySection } from '@/src/components/surveys/SurveySection';
import { Survey, SurveyCardSkeleton } from '@/src/components/surveys/SurveyCard';
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
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm/5 font-medium opacity-90">کیف پول اصلی</div>
        <IconButton
          aria-label={hidden ? 'نمایش موجودی' : 'مخفی کردن موجودی'}
          onClick={() => setHidden(v => !v)}
          variant="outline"
          color="primary"
          className="text-white hover:bg-white/15 border-white/20"
        >
          {hidden ? <PiEye className="h-4 w-4" /> : <PiEyeSlash className="h-4 w-4" />}
        </IconButton>
      </div>

      <div className="mb-1 text-2xl font-semibold tracking-tight">
        {isLoading && !wallet ? 'در حال بارگذاری...' : hidden ? '•••••' : `${formatCurrencyFa(balance)} ریال`}
      </div>
      <div className="mb-4 text-sm font-normal text-emerald-100">
        آخرین بروزرسانی: {formatRelativeFa(lastUpdate)}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/20 p-2 text-sm text-red-100">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={handleRefresh} className="ml-2 text-xs underline hover:no-underline">
              تلاش مجدد
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleManageWallet}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
        >
          <PiGear className="h-4 w-4" />
          مدیریت
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PiArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </button>
      </div>
    </div>
  );
}

/* =========================
   Service Cards (Static)
========================= */

const services = [
  { id: 'tour', title: 'تور', icon: <PiMapPinDuotone className="h-5 w-5" />, accent: 'blue', disabled: false },
  { id: 'facility', title: 'تسهیلات', icon: <PiMoney className="h-5 w-5" />, accent: 'emerald', disabled: false },
  { id: 'survey', title: 'نظرسنجی', icon: <PiFileText className="h-5 w-5" />, accent: 'amber', disabled: false },
  { id: 'flight', title: 'به زودی ...', icon: <PiDiamondDuotone className="h-5 w-5" />, accent: 'indigo', disabled: true },
  { id: 'insurance', title: 'به زودی ...', icon: <PiShieldCheck className="h-5 w-5" />, accent: 'rose', disabled: true },
  { id: 'car', title: 'به زودی ...', icon: <PiTruck className="h-5 w-5" />, accent: 'cyan', disabled: true },
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
   Page (Final)
========================= */

export default function HomeDashboard() {
  const { tours, isLoading: toursLoading, isError: toursError } = useToursList();
  const { facilities, isLoading: facilitiesLoading, isError: facilitiesError } = useFacilitiesList();
  const { surveys, isLoading: surveysLoading, isError: surveysError } = useSurveysList();
  const router = useRouter();

  function handleServiceSelect(id: string): void {
    if (id === 'facility') {
      router.push('/facilities');
    } else if (id === 'tour') {
      router.push('/tours');
    }
    else if (id === 'survey') {
      router.push('/surveys');
    }
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" dir="rtl">
        <ScrollableArea className="flex-1 min-h-0" hideScrollbar={true}>
          <div className="space-y-4">
            {/* Wallet */}
            <section>
              <WalletCard />
            </section>

            {/* Services */}
            <section className="px-4">
              <ServicesGrid items={services} onSelect={handleServiceSelect} />
            </section>

            {/* Tours Section */}
            <section className="px-4 my-6">
              {toursError && <div className="text-center text-red-600 py-6">خطا در دریافت اطلاعات تورها</div>}
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
                !toursError && <TourSection seeAllHref="/tours" title="تورها" dir="rtl" tours={tours} />
              )}
            </section>

            {/* Facilities Section */}
            <section className="px-4 my-6">
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
            <section className="px-4 my-6">
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
        </ScrollableArea>
      </div>
  );
}
