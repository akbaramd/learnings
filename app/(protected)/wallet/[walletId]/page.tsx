'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { selectWallet, selectWalletLastFetched } from '@/src/store/wallets';
import { useSelector } from 'react-redux';
import { useWalletPageHeader } from './WalletPageHeaderContext';
import {
  PiMoney,
  PiClock,
  PiCalendar,
  PiArrowClockwise,
  PiReceipt,
  PiPlusCircle,
} from 'react-icons/pi';

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

interface WalletPageProps {
  params: Promise<{
    walletId?: string;
  }>;
}

export default function WalletPage({ params }: WalletPageProps) {
  const router = useRouter();
  const { walletId } = use(params);
  const { fetchWallet, refreshWalletData } = useLazyWallets();
  const wallet = useSelector(selectWallet);
  const lastFetched = useSelector(selectWalletLastFetched);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setHeaderState } = useWalletPageHeader();

  // Handle case where walletId might be undefined
  const currentWalletId = walletId || wallet?.id || 'default';
  const lastHeaderStateRef = useRef<string>('');

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await refreshWalletData(currentWalletId);
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
      setError('خطا در بروزرسانی اطلاعات کیف پول');
    } finally {
      setIsLoading(false);
    }
  }, [currentWalletId, refreshWalletData]);

  const handleBack = useCallback(() => {
    // Check if came from dashboard or wallet pages
    if (document.referrer && (document.referrer.includes('/dashboard') || document.referrer.includes('/wallet'))) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  // Set page header - only update when necessary
  useEffect(() => {
    const headerKey = `${currentWalletId}-${isLoading}`;
    if (lastHeaderStateRef.current === headerKey) {
      return; // Skip if same state
    }
    
    lastHeaderStateRef.current = headerKey;
    setHeaderState({
      title: 'مدیریت کیف پول',
      titleIcon: <PiMoney className="h-5 w-5" />,
      subtitle: `${currentWalletId.slice(0, 8)}...`,
      showBackButton: true,
      onBack: handleBack,
      rightActions: [
        {
          icon: <PiArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />,
          onClick: handleRefresh,
          label: 'بروزرسانی',
          disabled: isLoading,
          'aria-label': 'بروزرسانی',
        },
      ],
    });
  }, [currentWalletId, isLoading, setHeaderState, handleBack, handleRefresh]);

  // Fetch wallet data on component mount
  useEffect(() => {
    const loadWalletData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchWallet();
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
        setError('خطا در بارگذاری اطلاعات کیف پول');
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, [fetchWallet]);

  const handleTransactions = () => {
    if (currentWalletId) {
      router.push(`/wallet/${currentWalletId}/transactions`);
    }
  };

  const handleDeposits = () => {
    if (currentWalletId) {
      router.push(`/wallet/${currentWalletId}/deposits`);
    }
  };

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
      <div className="h-full w-full flex flex-col" dir="rtl">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
          <div className="p-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Wallet Balance Card - Modern Design */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                      <PiMoney className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-50 opacity-90">موجودی کیف پول</div>
                      <div className="text-xs text-emerald-100 opacity-75 mt-0.5">
                        {formatRelativeFa(wallet?.lastUpdated || lastFetched)}
                      </div>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="animate-spin">
                      <PiArrowClockwise className="h-5 w-5 text-white/80" />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="text-4xl font-bold mb-1">
                    {wallet ? `${formatCurrencyFa(wallet.balance)} ریال` : 'در حال بارگذاری...'}
                  </div>
                  {wallet && (
                    <div className="text-sm text-emerald-50 opacity-80 mt-1">
                      {wallet.currency || 'ریال'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions - Improved Design */}
            <div className="grid grid-cols-2 gap-3">
              {/* Transactions Button */}
              <button
                type="button"
                onClick={handleTransactions}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                    <PiReceipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">تراکنش‌ها</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">مشاهده تاریخچه</div>
                  </div>
                </div>
              </button>

              {/* Deposits Button */}
              <button
                type="button"
                onClick={handleDeposits}
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
                    <PiPlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">واریزها</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">مدیریت واریز</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Wallet Information - Card Design */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                اطلاعات کیف پول
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                      <PiMoney className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">شناسه کیف پول</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                    {wallet?.id ? `${wallet.id.slice(0, 8)}...` : `${currentWalletId.slice(0, 8)}...`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                      <PiCalendar className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">تاریخ ایجاد</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                      <PiClock className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">آخرین فعالیت</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatRelativeFa(wallet?.lastUpdated || null)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
