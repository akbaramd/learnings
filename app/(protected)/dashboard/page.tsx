'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { IconButton } from '@/src/components/ui/IconButton';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiEye, PiEyeSlash, PiGear, PiArrowClockwise, PiMapPinDuotone, PiMoney, PiBuildingOffice, PiDiamondDuotone, PiShieldCheck, PiTruck } from 'react-icons/pi';
import { ServicesGrid } from '@/src/components/services/ServiceCard';
import { TourSection } from '@/src/components/tours/TourSection';
import { Tour } from '@/src/components/tours/TourCard';
import { useGetToursPaginatedQuery } from '@/src/store/tours/tours.queries';
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

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm/5 font-medium opacity-90">کیف پول اصلی</div>
        <IconButton
          aria-label={hidden ? 'نمایش موجودی' : 'مخفی کردن موجودی'}
          onClick={() => setHidden(v => !v)}
          variant="ghost"
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
  { id: 'survey', title: 'نظرسنجی', icon: <PiBuildingOffice className="h-5 w-5" />, accent: 'amber', disabled: false },
  { id: 'flight', title: 'پرواز', icon: <PiDiamondDuotone className="h-5 w-5" />, accent: 'indigo', disabled: true },
  { id: 'insurance', title: 'بیمه', icon: <PiShieldCheck className="h-5 w-5" />, accent: 'rose', disabled: true },
  { id: 'car', title: 'خودرو', icon: <PiTruck className="h-5 w-5" />, accent: 'cyan', disabled: true },
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
   Page (Final)
========================= */

export default function HomeDashboard() {
  const { tours, isLoading, isError } = useToursList();
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
    <div className="h-full flex flex-col" dir="rtl">
        <ScrollableArea className="flex-1" hideScrollbar={true}>
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
              {isLoading && <div className="text-center py-6">در حال بارگذاری تورها...</div>}
              {isError && <div className="text-center text-red-600 py-6">خطا در دریافت اطلاعات تورها</div>}
              {!isLoading && !isError && <TourSection seeAllHref="/tours" title="تورها" dir="rtl" tours={tours} />}
            </section>
          </div>
        </ScrollableArea>
      </div>
  );
}
