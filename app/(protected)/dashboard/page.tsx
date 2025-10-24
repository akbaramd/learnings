'use client';

import { useState } from 'react';
import { IconButton } from '@/src/components/ui/IconButton';
import { useTheme } from '@/src/hooks/useTheme';
import {
  PiListDashesDuotone,
  PiBell,
  PiSun,
  PiMoon,
  PiComputerTowerDuotone,
  PiEye,
  PiEyeSlash,
  PiPlus,
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

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  lastUpdate: Date;
}

const wallet: Wallet = {
  id: '1',
  name: 'کیف پول اصلی',
  balance: 2_500_000,
  currency: 'تومان',
  lastUpdate: new Date(Date.now() - 1000 * 60 * 42) // 42 minutes ago
};

function formatCurrencyFa(amount: number) {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

function formatRelativeFa(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'هم‌اکنون';
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

function WalletCard() {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm/5 font-medium opacity-90">{wallet.name}</div>
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
        {hidden ? '•••••' : `${formatCurrencyFa(wallet.balance)} ${wallet.currency}`}
      </div>
      <div className="mb-4 text-sm font-normal text-emerald-100">آخرین بروزرسانی: {formatRelativeFa(wallet.lastUpdate)}</div>

       <div className="grid grid-cols-2 gap-2">
         <button
           type="button"
           className="inline-flex items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40"
         >
           <PiPlus className="h-4 w-4" />
           واریز
         </button>
         <button
           type="button"
           className="inline-flex items-center justify-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40"
         >
           <PiArrowClockwise className="h-4 w-4" />
           بروزرسانی
         </button>
       </div>
    </div>
  );
}

/* =========================
   Theme Toggle
========================= */

function ThemeIconButton() {
  const { theme, toggleTheme } = useTheme();

  const icon =
    theme === 'light' ? <PiSun className="h-4 w-4" /> :
    theme === 'dark' ? <PiMoon className="h-4 w-4" /> :
    <PiComputerTowerDuotone className="h-4 w-4" />;

  const label =
    theme === 'light' ? 'Switch to dark mode' :
    theme === 'dark' ? 'Switch to system mode' :
    'Switch to light mode';

  return (
    <IconButton aria-label={label} onClick={toggleTheme} variant="ghost">
      {icon}
    </IconButton>
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
};

const services: Service[] = [
  { id: 'facility', title: 'تسهیلات', icon: <PiMoney className="h-5 w-5" />, accent: 'emerald' },
  { id: 'tour',     title: 'تور',     icon: <PiMapPinDuotone className="h-5 w-5" />,      accent: 'blue' },
  { id: 'hotel',    title: 'هتل',     icon: <PiBuildingOffice className="h-5 w-5" />,          accent: 'amber' },
  { id: 'flight',   title: 'پرواز',   icon: <PiDiamondDuotone className="h-5 w-5" />, accent: 'indigo' },
  { id: 'insurance',title: 'بیمه',    icon: <PiShieldCheck className="h-5 w-5" />,   accent: 'rose' },
  { id: 'car',      title: 'خودرو',   icon: <PiTruck className="h-5 w-5" />,         accent: 'cyan' }
];

function ServiceCard({ s, onClick }: { s: Service; onClick?: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(s.id)}
      className="flex flex-col items-center gap-2 rounded-md border border-gray-200 bg-white p-3 text-center transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <div className="text-gray-600 dark:text-gray-300">
        {s.icon}
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-200">{s.title}</span>
    </button>
  );
}

function ServicesGrid() {
  const handleClick = (id: string) => {
    // integrate navigation or modal here
    // e.g., router.push(`/services/${id}`)
    // kept empty intentionally to keep the component framework-agnostic
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
   Header Title
========================= */

const BrandTitle = () => (
  <div className="flex flex-col items-center leading-none">
    <h1 className="text-base font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
      سیستم رفاهی مهندسین
    </h1>
  </div>
);

/* =========================
   Page (Final)
========================= */

export default function HomeDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-900 dark:text-gray-100">
      {/* Top App Bar */}
       <header className="sticky top-0 z-40 border-b border-gray-200 bg-white backdrop-blur dark:border-gray-700 dark:bg-gray-800">
         <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
           <IconButton aria-label="Open menu">
             <PiListDashesDuotone className="h-4 w-4 text-gray-700 dark:text-gray-200" />
           </IconButton>
           <BrandTitle />
           <div className="flex items-center gap-2">
             <ThemeIconButton />
             <IconButton aria-label="Notifications">
               <PiBell className="h-4 w-4 text-gray-700 dark:text-gray-200" />
             </IconButton>
           </div>
         </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 pb-24">
        {/* Wallet */}
        <section className="mt-4">
          <WalletCard />
        </section>

        {/* Services (3 per row, minimal, modern) */}
        <section className="mt-4">
          <ServicesGrid />
        </section>
      </main>

      {/* Bottom padding handled by pb-24 in main; add bottom nav if needed */}
    </div>
  );
}
