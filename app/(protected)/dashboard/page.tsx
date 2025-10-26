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
    <div className="rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
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

function ServiceCard({ s, onClick }: { s: Service; onClick?: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => !s.disabled && onClick?.(s.id)}
      disabled={s.disabled}
      className={`flex flex-col items-center gap-2 rounded-md border p-3 text-center transition-all duration-200 w-full ${
        s.disabled
          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
          : s.id === 'tour'
          ? 'border-gray-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:scale-105 dark:border-gray-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40'
          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
      }`}
    >
      <div className={`${
        s.disabled 
          ? 'text-gray-400 dark:text-gray-500' 
          : s.id === 'tour'
          ? 'text-emerald-700 dark:text-emerald-300'
          : 'text-gray-600 dark:text-gray-300'
      }`}>
        {s.icon}
      </div>
      <span className={`text-xs font-medium ${
        s.disabled 
          ? 'text-gray-400 dark:text-gray-500' 
          : s.id === 'tour'
          ? 'text-emerald-800 dark:text-emerald-200'
          : 'text-gray-700 dark:text-gray-200'
      }`}>
        {s.title}
      </span>
    </button>
  );
}

function ServicesGrid() {
  const handleClick = (serviceId: string) => {
    // Only handle clicks for enabled services
    const service = services.find(s => s.id === serviceId);
    if (service?.disabled) {
      console.log('Service is not ready yet:', serviceId);
      return;
    }
    
    // integrate navigation or modal here
    // e.g., router.push(`/services/${serviceId}`)
    console.log('Service clicked:', serviceId);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {services.map(s => (
        <ServiceCard key={s.id} s={s} onClick={handleClick} />
      ))}
    </div>
  );
}


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
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
       
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Wallet */}
            <section>
              <WalletCard />
            </section>

            {/* Services (3 per row, minimal, modern) */}
            <section>
              <ServicesGrid />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
