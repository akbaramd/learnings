'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { selectWallet, selectWalletLastFetched } from '@/src/store/wallets';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/src/components/ui/PageHeader';
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

  // Handle case where walletId might be undefined
  const currentWalletId = walletId || wallet?.id || 'default';

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

  const handleRefresh = async () => {
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
  };

  const handleBack = () => {
    router.back();
  };

  const handleTransactions = () => {
    router.push(`/wallet/${currentWalletId}/transactions`);
  };

  const handleDeposits = () => {
    router.push(`/wallet/${currentWalletId}/deposits`);
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
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
        <PageHeader
          title="مدیریت کیف پول"
          titleIcon={<PiMoney className="h-5 w-5" />}
          subtitle={`${currentWalletId.slice(0, 8)}...`}
          showBackButton
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />,
              onClick: handleRefresh,
              label: 'بروزرسانی',
              disabled: isLoading,
              'aria-label': 'بروزرسانی',
            },
          ]}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PiMoney className="h-6 w-6" />
              <span className="text-lg font-semibold">موجودی کیف پول</span>
            </div>
            {isLoading && (
              <div className="animate-spin">
                <PiArrowClockwise className="h-5 w-5" />
              </div>
            )}
          </div>
          
          <div className="text-3xl font-bold mb-2">
            {wallet ? `${formatCurrencyFa(wallet.balance)} ریال` : 'در حال بارگذاری...'}
          </div>
          
          <div className="text-emerald-100 text-sm">
            آخرین بروزرسانی: {formatRelativeFa(wallet?.lastUpdated || lastFetched)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Transactions Button */}
          <button
            onClick={handleTransactions}
            className="flex items-center gap-3 p-4 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-sm"
          >
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <PiReceipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">تراکنش‌ها</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">تاریخچه</div>
            </div>
          </button>

          {/* Deposits Button */}
          <button
            onClick={handleDeposits}
            className="flex items-center gap-3 p-4 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 hover:shadow-sm"
          >
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
              <PiPlusCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">واریزها</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">مدیریت</div>
            </div>
          </button>
        </div>

        {/* Wallet Information */}
        <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            اطلاعات کیف پول
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <PiMoney className="h-4 w-4" />
                <span className="text-sm">شناسه کیف پول</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                {wallet?.id ? `${wallet.id.slice(0, 8)}...` : `${currentWalletId.slice(0, 8)}...`}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <PiCalendar className="h-4 w-4" />
                <span className="text-sm">تاریخ ایجاد</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <PiClock className="h-4 w-4" />
                <span className="text-sm">آخرین فعالیت</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatRelativeFa(wallet?.lastUpdated || null)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Coming Soon Features */}
        <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            قابلیت‌های آینده
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div>• واریز به کیف پول</div>
            <div>• انتقال وجه</div>
            <div>• تاریخچه تراکنش‌ها</div>
            <div>• گزارش‌گیری مالی</div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </>
  );
}
