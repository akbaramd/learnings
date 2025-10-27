'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/src/components/ui/IconButton';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { selectWallet, selectWalletLastFetched } from '@/src/store/wallets';
import { useSelector } from 'react-redux';
import {
  PiEye,
  PiEyeSlash,
  PiGear,
  PiMoney,
  PiMapPinDuotone,
  PiShieldCheck,
  PiTruck,
  PiBuildingOffice,
  PiDiamondDuotone,
  PiArrowClockwise
} from 'react-icons/pi';
import GridSliderDemo from '@/src/components/ui/Slider';
import { TourSection } from '@/src/components/tours/TourSection';
import { Tour } from '@/src/components/tours/TourCard';
import { ServicesGrid } from '@/src/components/services/ServiceCard';

/* =========================
   Wallet (clean + minimal)
========================= */

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return amount.toString();
  }
}

function formatRelativeFa(date: Date | string | null) {
  if (!date) return 'نامشخص';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'نامشخص';
    
    const diff = Date.now() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'هم‌اکنون';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${days} روز پیش`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'نامشخص';
  }
}

function WalletCard() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchWallet } = useLazyWallets();
  const wallet = useSelector(selectWallet);
  const lastFetched = useSelector(selectWalletLastFetched);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wallet balance on component mount
  useEffect(() => {
    const loadWalletBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchWallet();
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setError('خطا در بارگذاری موجودی کیف پول');
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletBalance();
  }, [fetchWallet]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchWallet();
    } catch (error) {
      console.error('Failed to refresh wallet balance:', error);
      setError('خطا در بروزرسانی موجودی کیف پول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageWallet = () => {
    // Get wallet ID from current wallet or use a default
    const currentWalletId = wallet?.id || 'default';
    router.push(`/wallet/${currentWalletId}`);
  };


  const balance = wallet?.balance ?? 0;
  const lastUpdate = wallet?.lastUpdated || lastFetched;
  
  // Show loading state if wallet is null and we're loading
  const showLoading = isLoading && !wallet;

  return (
    <div className=" bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm/5 font-medium opacity-90">
          کیف پول اصلی
        </div>
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
        {showLoading ? (
          <div className="animate-pulse">در حال بارگذاری...</div>
        ) : (
          hidden ? '•••••' : `${formatCurrencyFa(balance)} ریال`
        )}
      </div>
      <div className="mb-4 text-sm font-normal text-emerald-100">
        آخرین بروزرسانی: {formatRelativeFa(lastUpdate)}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/20 p-2 text-sm text-red-100">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={handleRefresh}
              className="ml-2 text-xs underline hover:no-underline"
            >
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
   Service Cards (3 per row)
========================= */

type Service = {
  id: string;
  title: string;
  icon: React.ReactNode;
  accent: string; // Tailwind color token for icon bg ring
  disabled: boolean;
};

const services: Service[] = [
  { id: 'tour',     title: 'تور',     icon: <PiMapPinDuotone className="h-5 w-5" />,      accent: 'blue', disabled: false },
  { id: 'facility', title: 'تسهیلات', icon: <PiMoney className="h-5 w-5" />, accent: 'emerald', disabled: true },
  { id: 'hotel',    title: 'هتل',     icon: <PiBuildingOffice className="h-5 w-5" />,          accent: 'amber', disabled: true },
  { id: 'flight',   title: 'پرواز',   icon: <PiDiamondDuotone className="h-5 w-5" />, accent: 'indigo', disabled: true },
  { id: 'insurance',title: 'بیمه',    icon: <PiShieldCheck className="h-5 w-5" />,   accent: 'rose', disabled: true },
  { id: 'car',      title: 'خودرو',   icon: <PiTruck className="h-5 w-5" />,         accent: 'cyan', disabled: true }
];
const STATIC_TOURS: Tour[] = [
  {
    id: 't1',
    title: 'تور یک‌روزه جنگل الیمستان',
    description: 'پیاده‌روی سبک و طبیعت‌گردی در جنگل مه‌آلود الیمستان.',
    photos: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ8Tajf9WJYhXLGNZSxlgAd5dGirm_FqHPtA&s'],
    isRegistrationOpen: true,
    difficultyLevel: 2,
    price: 950000,
    registrationStart: '2025-11-01',
    registrationEnd: '2025-11-20',
    tourStart: '2025-12-01',
    tourEnd: '2025-12-01',
    maxCapacity: 30,
    remainingCapacity: 12,
  },
  {
    id: 't2',
    title: 'کویر مرنجاب و کاروانسرای عباسی',
    description: 'تجربه بی‌نظیر رمل‌های کویری، آسمان پرستاره و سکوت کویر.',
    photos: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ8Tajf9WJYhXLGNZSxlgAd5dGirm_FqHPtA&s'],
    isRegistrationOpen: true,
    difficultyLevel: 1,
    price: 1250000,
    registrationStart: '2025-11-02',
    registrationEnd: '2025-11-28',
    tourStart: '2025-12-05',
    tourEnd: '2025-12-06',
    maxCapacity: 40,
    remainingCapacity: 3,
  },
  {
    id: 't3',
    title: 'قله توچال از دربند',
    description: 'برنامه صعود سبک تا پناهگاه شروین و قله توچال.',
    photos: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ8Tajf9WJYhXLGNZSxlgAd5dGirm_FqHPtA&s'],
    isRegistrationOpen: false,
    difficultyLevel: 3,
    price: 800000,
    registrationStart: '2025-10-15',
    registrationEnd: '2025-10-25',
    tourStart: '2025-11-03',
    tourEnd: '2025-11-03',
    maxCapacity: 25,
    remainingCapacity: 0,
  },
  {
    id: 't4',
    title: 'ماسال و ییلاقات گیلان',
    description: 'سفری دو روزه بین ابرها با ویوی بی‌نظیر ییلاقات.',
    photos: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ8Tajf9WJYhXLGNZSxlgAd5dGirm_FqHPtA&s'],
    isRegistrationOpen: true,
    difficultyLevel: 2,
    price: 2100000,
    registrationStart: '2025-11-05',
    registrationEnd: '2025-11-30',
    tourStart: '2025-12-10',
    tourEnd: '2025-12-11',
    maxCapacity: 35,
    remainingCapacity: 20,
  },
];


/* =========================
   Page (Final)
========================= */

export default function HomeDashboard() {


  return (
    <>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9CA3AF #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F3F4F6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9CA3AF;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #4B5563 #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
      <div className="h-full flex flex-col" dir="rtl">
       
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Wallet */}
            <section>
              <WalletCard />
            </section>

            {/* Services (3 per row, minimal, modern) */}
            <section className='px-4'>
              <ServicesGrid  items={services} />
              
            </section>
            <section className='px-4 my-6' >
              <TourSection seeAllHref='/tours' title='تور ها' dir='rtl' tours={STATIC_TOURS}></TourSection>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
