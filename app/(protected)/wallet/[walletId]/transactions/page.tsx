'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyWallets } from '@/src/hooks/useLazyWallets';
import { selectWalletTransactions } from '@/src/store/wallets';
import { useSelector } from 'react-redux';
import { Button } from '@/src/components/ui/Button';
import {
  PiArrowLeft,
  PiReceipt,
  PiArrowDown,
  PiArrowUp,
  PiArrowsClockwise,
  PiCurrencyCircleDollar,
  PiMoney,
  PiArrowClockwise,
} from 'react-icons/pi';
import type { TransactionType } from '@/src/store/wallets/wallets.types';

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    // فرمت با کاما
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return amount.toString();
  }
}

function formatAbsolute(date: string | undefined) {
  if (!date) return 'نامشخص';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'نامشخص';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  } catch {
    return 'نامشخص';
  }
}

function getTransactionTypeInfo(type: TransactionType) {
  switch (type) {
    case 'Deposit':
      return {
        icon: PiArrowDown,
        text: 'واریز',
        description: 'مبلغ به کیف پول شما افزوده شد',
        color: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        amountColor: 'text-green-700 dark:text-green-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '+',
      };
    case 'Withdrawal':
      return {
        icon: PiArrowUp,
        text: 'برداشت',
        description: 'مبلغ از کیف پول شما کسر شد',
        color: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        amountColor: 'text-orange-700 dark:text-orange-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '-',
      };
    case 'Payment':
      return {
        icon: PiMoney,
        text: 'پرداخت',
        description: 'پرداخت از طریق کیف پول انجام شد',
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        amountColor: 'text-blue-700 dark:text-blue-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '-',
      };
    case 'Adjustment':
      return {
        icon: PiArrowsClockwise,
        text: 'تعدیل',
        description: 'موجودی کیف پول شما تعدیل شد',
        color: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        amountColor: 'text-purple-700 dark:text-purple-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '±',
      };
    case 'Refund':
      return {
        icon: PiCurrencyCircleDollar,
        text: 'بازگشت وجه',
        description: 'وجه به کیف پول شما بازگردانده شد',
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        amountColor: 'text-emerald-700 dark:text-emerald-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '+',
      };
    case 'Transfer':
      return {
        icon: PiArrowsClockwise,
        text: 'انتقال',
        description: 'انتقال وجه بین حساب‌ها انجام شد',
        color: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-700',
        amountColor: 'text-gray-700 dark:text-gray-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '±',
      };
    default:
      return {
        icon: PiReceipt,
        text: 'نامشخص',
        description: 'تراکنش انجام شد',
        color: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-700',
        amountColor: 'text-gray-700 dark:text-gray-300',
        balanceColor: 'text-gray-700 dark:text-gray-300',
        prefix: '',
      };
  }
}

interface TransactionsPageProps {
  params: Promise<{
    walletId?: string;
  }>;
}

export default function TransactionsPage({ params }: TransactionsPageProps) {
  const router = useRouter();
  const { walletId } = use(params);
  const { fetchTransactions } = useLazyWallets();
  const transactions = useSelector(selectWalletTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle case where walletId might be undefined
  const currentWalletId = walletId || 'default';

  // Fetch transactions on component mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchTransactions({ pageNumber: 1, pageSize: 50, walletId: currentWalletId });
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        setError('خطا در بارگذاری لیست تراکنش‌ها');
      } finally {
        setIsLoading(false);
      }
    };  

    loadTransactions();
  }, [fetchTransactions, currentWalletId]);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchTransactions({ pageNumber: 1, pageSize: 50, walletId: currentWalletId });
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
      setError('خطا در بروزرسانی لیست تراکنش‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/wallet/${currentWalletId}`);
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
                <PiReceipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">تراکنش‌ها</span>
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
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Transactions List */}
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <div className="h-8 w-8 animate-spin border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const typeInfo = getTransactionTypeInfo(transaction.type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                     <div
                       key={transaction.id}
                       className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
                     >
                       {/* Top Row: Icon, Amount, Type Badge */}
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-3 flex-1">
                           <div className={`p-2 rounded-xl ${typeInfo.bgColor} flex-shrink-0`}>
                             <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                           </div>
                           <div className={`text-base font-semibold ${typeInfo.amountColor}`}>
                             {formatCurrencyFa(transaction.amount)} {typeInfo.prefix}ریال
                           </div>
                         </div>
                         <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeInfo.bgColor} ${typeInfo.color} flex-shrink-0`}>
                           {typeInfo.text}
                         </div>
                       </div>
                       
                       {/* Divider Line */}
                       <div className="border-t border-gray-200 dark:border-gray-700/50 my-2.5" />
                       
                       {/* Description */}
                       <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed opacity-80">
                         {typeInfo.description}
                       </div>
                       
                       {/* Bottom Row: Balance Before (Right) and Date (Left) */}
                       <div className="flex items-center justify-between">
                         <div className="text-xs text-gray-500 dark:text-gray-400">
                           {formatAbsolute(transaction.createdAt)}
                         </div>
                         {transaction.balanceAfter !== undefined && (
                           <div className={`text-xs ${typeInfo.balanceColor} opacity-75`}>
                             موجودی قبل: {formatCurrencyFa(transaction.balanceAfter)} ریال
                           </div>
                         )}
                       </div>
                     </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <PiReceipt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">هنوز تراکنشی ثبت نشده است</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">تراکنش‌های شما در اینجا نمایش داده می‌شوند</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

