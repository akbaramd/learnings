'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { selectWalletDeposits } from '@/src/store/wallets';
import { useSelector } from 'react-redux';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import {
  PiArrowLeft,
  PiPlusCircle,
  PiClock,
  PiCheckCircle,
  PiXCircle,
  PiReceipt,
  PiArrowClockwise,
  PiCopy,
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

function getStatusInfo(status: string, statusText?: string) {
  const displayText = statusText || getDefaultStatusText(status);
  
  switch (status) {
    case 'Completed':
      return {
        icon: PiCheckCircle,
        text: displayText,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    case 'pending':
      return {
        icon: PiClock,
        text: displayText,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'failed':
      return {
        icon: PiXCircle,
        text: displayText,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    default:
      return {
        icon: PiClock,
        text: displayText,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        borderColor: 'border-gray-200 dark:border-gray-700'
      };
  }
}

function getDefaultStatusText(status: string) {
  switch (status) {
    case 'Completed':
      return 'تکمیل شده';
    case 'Pending':
      return 'در انتظار';
    case 'failed':
      return 'ناموفق';
    default:
      return 'نامشخص';
  }
}

function copyToClipboard(text: string, toast: (opts: { title: string; description: string; variant: 'success' | 'error'; duration: number }) => void) {
  navigator.clipboard.writeText(text).then(() => {
    toast({
      title: 'کپی شد',
      description: 'کد پیگیری در کلیپ‌بورد کپی شد',
      variant: 'success',
      duration: 2000,
    });
  }).catch(err => {
    console.error('Failed to copy: ', err);
    toast({
      title: 'خطا در کپی',
      description: 'خطا در کپی کردن کد پیگیری',
      variant: 'error',
      duration: 3000,
    });
  });
}

interface DepositsPageProps {
  params: Promise<{
    walletId?: string;
  }>;
}

export default function DepositsPage({ params }: DepositsPageProps) {
  const router = useRouter();
  const { walletId } = use(params);
  const { fetchDeposits } = useLazyWallets();
  const deposits = useSelector(selectWalletDeposits);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle case where walletId might be undefined
  const currentWalletId = walletId || 'default';

  // Fetch deposits on component mount
  useEffect(() => {
    const loadDeposits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchDeposits({ pageNumber: 1, pageSize: 10, walletId: currentWalletId });
      } catch (error) {
        console.error('Failed to fetch deposits:', error);
        setError('خطا در بارگذاری لیست واریزها');
      } finally {
        setIsLoading(false);
      }
    };  

    loadDeposits();
  }, [fetchDeposits, currentWalletId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchDeposits({ pageNumber: 1, pageSize: 10, walletId: currentWalletId });
    } catch (error) {
      console.error('Failed to refresh deposits:', error);
      setError('خطا در بروزرسانی لیست واریزها');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/wallet/${currentWalletId}`);
  };

  const handleCreateDeposit = () => {
    router.push(`/wallet/${currentWalletId}/deposits/create`);
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
      <div className="h-full flex flex-col" dir="rtl">
        {/* Breadcrumb Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <PiArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">واریزها</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {currentWalletId.slice(0, 8)}...
                </span>
              </div>
              <div className="flex-1"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="بروزرسانی"
              >
                <PiArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Add Deposit Button */}
            <Button
              onClick={handleCreateDeposit}
              variant="primary"
              size="lg"
              block
              leftIcon={<PiPlusCircle className="h-5 w-5" />}
            >
              واریز جدید
            </Button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Deposits List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="h-8 w-8 animate-spin border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
                  </div>
                ) : deposits && deposits.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {deposits.map((deposit) => {
                      const statusInfo = getStatusInfo(deposit.status, deposit.statusText);
                      
                      return (
                         <div key={deposit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                           {/* Amount and Status Row */}
                           <div className="flex items-center justify-between mb-2">
                             <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                               +{formatCurrencyFa(deposit.amount)} ریال
                             </div>
                             <div className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                               {statusInfo.text}
                             </div>
                           </div>
                           
                           {/* Date Row */}
                           <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                             {formatRelativeFa(deposit.createdAt)}
                           </div>
                           
                           {/* Tracking Code Row */}
                           <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-dashed border-green-200 dark:border-green-600">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <div className="text-xs text-green-700 dark:text-green-300 font-medium">کد پیگیری:</div>
                                 <div className="font-mono text-xs font-semibold text-green-800 dark:text-green-200">
                                   {deposit.trackingCode}
                                 </div>
                               </div>
                               <button
                                 onClick={() => copyToClipboard(deposit.trackingCode || '', toast)}
                                 className="p-1.5 rounded-md text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                                 title="کپی کد پیگیری"
                               >
                                 <PiCopy className="h-3.5 w-3.5" />
                               </button>
                             </div>
                             
                             {/* View Bill Button for Pending Deposits */}
                             {deposit.status === 'Pending' && deposit.trackingCode && (
                               <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-600">
                                 <div className="text-xs text-green-700 dark:text-green-300 mb-1">
                                   برای مشاهده وضعیت پرداخت:
                                 </div>
                                 <Button
                                   onClick={() => {
                                     if (deposit.trackingCode && deposit.trackingCode.trim() !== '') {
                                       router.push(`/bills/${encodeURIComponent(deposit.trackingCode)}?billType=WalletDeposit`);
                                     } else {
                                       toast({
                                         title: 'خطا',
                                         description: 'کد پیگیری موجود نیست',
                                         variant: 'error',
                                         duration: 3000
                                       });
                                     }
                                   }}
                                   variant="secondary"
                                   size="sm"
                                   className="w-full text-xs"
                                   leftIcon={<PiReceipt className="h-3.5 w-3.5" />}
                                 >
                                   مشاهده صورت حساب
                                 </Button>
                               </div>
                             )}
                           </div>
                         </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <PiReceipt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">هنوز واریزی ثبت نشده است</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">برای شروع، واریز جدیدی ایجاد کنید</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
