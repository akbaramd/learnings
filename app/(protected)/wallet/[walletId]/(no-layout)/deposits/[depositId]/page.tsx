'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetDepositDetailsQuery } from '@/src/store/wallets/wallets.queries';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import {
  PiArrowLeft,
  PiReceipt,
  PiClock,
  PiCheckCircle,
  PiXCircle,
  PiCopy,
} from 'react-icons/pi';

function formatCurrencyFa(amount: number) {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch {
    return String(amount ?? '0');
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'Completed':
      return { icon: PiCheckCircle, text: 'تکمیل شده', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    case 'Requested':
      return { icon: PiClock, text: 'درخواست ثبت شد', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
    case 'AwaitingBill':
      return { icon: PiClock, text: 'در انتظار صدور صورت‌حساب', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    case 'AwaitingPayment':
      return { icon: PiClock, text: 'در انتظار پرداخت', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    case 'Failed':
      return { icon: PiXCircle, text: 'ناموفق', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    case 'Cancelled':
    case 'Expired':
      return { icon: PiXCircle, text: 'نامعتبر', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    default:
      return { icon: PiClock, text: 'نامشخص', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
  }
}

function copyToClipboard(text: string, notify: (o: { title: string; description: string; variant: 'success' | 'error'; duration: number }) => void) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    notify({ title: 'کپی شد', description: 'کد پیگیری کپی شد', variant: 'success', duration: 2000 });
  }).catch(() => {
    notify({ title: 'خطا', description: 'کپی ناموفق بود', variant: 'error', duration: 2500 });
  });
}

interface PageProps {
  params: Promise<{ walletId?: string; depositId?: string }>; 
}

export default function DepositDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { walletId = 'default', depositId = '' } = use(params);

  const { data, isFetching, isLoading, error, refetch } = useGetDepositDetailsQuery(depositId, {
    skip: !depositId,
  });

  const details = data?.result || null;
  const status = details?.status || 'Requested';
  const badge = getStatusBadge(status);
  const StatusIcon = badge.icon;

  const goBack = () => router.push(`/wallet/${walletId}/deposits`);
  const goToBill = () => {
    if (!details?.trackingCode) return;
    router.push(`/bills/${encodeURIComponent(details.trackingCode)}?billType=WalletDeposit`);
  };

  const loading = isLoading || isFetching;

  // Auto-refresh details every 3 seconds while in waiting states
  useEffect(() => {
    if (!(status === 'Requested' || status === 'AwaitingBill')) return;
    const id = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(id);
  }, [status, refetch]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="subtle" size="sm" onClick={goBack} className="text-gray-600 dark:text-gray-300">
              <PiArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <PiReceipt className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">جزئیات واریز</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{walletId.slice(0,8)}...</span>
            </div>
            <div className="flex-1" />
            <Button variant="subtle" size="sm" onClick={() => refetch()} disabled={loading}>
              {loading ? <span className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : 'بروزرسانی'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error instanceof Error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="text-sm text-red-700 dark:text-red-200">
              خطا در دریافت جزئیات واریز
            </div>
          </div>
        )}

        {/* Loading and waiting state */}
        {loading  ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="h-10 w-10 animate-spin border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-3" />
            <div className="text-sm text-gray-600 dark:text-gray-300">{status === 'AwaitingBill' ? 'در انتظار صدور صورت‌حساب...' : status === 'Requested' ? 'ثبت درخواست واریز...' : 'در حال بارگذاری...'}</div>
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`rounded-lg border ${badge.border} ${badge.bg} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <StatusIcon className={`${badge.color} h-5 w-5`} />
                <div className={`text-sm font-medium ${badge.color}`}>{badge.text}</div>
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                +{formatCurrencyFa(details.amount)} ریال
              </div>
            </div>

            {/* Core info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">کد واریز</div>
                  <div className="font-mono text-gray-900 dark:text-gray-100">{details.id}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">کیف پول</div>
                  <div className="font-mono text-gray-900 dark:text-gray-100">{details.walletId}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">زمان ثبت</div>
                  <div className="text-gray-900 dark:text-gray-100">{formatAbsolute(details.requestedAt)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">زمان تکمیل</div>
                  <div className="text-gray-900 dark:text-gray-100">{formatAbsolute(details.completedAt)}</div>
                </div>
              </div>
            </div>

            {/* Tracking and actions */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-dashed border-green-200 dark:border-green-700 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-700 dark:text-green-300">کد پیگیری</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs font-semibold text-green-800 dark:text-green-200">{details.trackingCode || '-'}</div>
                  {details.trackingCode && (
                    <button
                      onClick={() => copyToClipboard(details.trackingCode || '', toast)}
                      className="p-1.5 rounded-md text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-800/30"
                      title="کپی کد پیگیری"
                    >
                      <PiCopy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Removed inline button - now in bottom fixed section */}
            </div>

            {/* Completed: success message */}
            {status === 'Completed' && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="text-sm text-emerald-800 dark:text-emerald-200">واریز با موفقیت تکمیل شد.</div>
              </div>
            )}
          {/* Awaiting bill issuance */}
          {(status === 'AwaitingBill' || status === 'Requested') && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-0.5">
                    در انتظار صدور صورت‌حساب
                  </div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    جزئیات واریز ثبت شده است. در حال حاضر منتظر صدور صورت‌حساب برای این واریزی هستیم. از شکیبایی شما سپاسگزاریم.
                  </div>
                </div>
              </div>
            </div>
          )}
            {/* Failed: error message */}
            {status === 'Failed' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm text-red-800 dark:text-red-200">واریز ناموفق بود. در صورت کسر وجه، با پشتیبانی تماس بگیرید.</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-600 dark:text-gray-300">
            موردی یافت نشد
          </div>
        )}
      </div>

      {/* Fixed Action Buttons at Bottom */}
      {details && !loading && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 py-2">
          <div className="flex gap-3">
            {/* AwaitingPayment: Show bill button */}
            {status === 'AwaitingPayment' && details.trackingCode && (
              <Button
                onClick={goToBill}
                variant="solid"
                size="lg"
                className="flex-1 py-3 text-base font-medium"
                leftIcon={<PiReceipt className="h-5 w-5" />}
              >
                پرداخت صورت‌حساب
              </Button>
            )}

            {/* Completed: Show bill button if tracking code exists */}
            {status === 'Completed' && details.trackingCode && (
              <Button
                onClick={goToBill}
                variant="solid"
                size="lg"
                className="flex-1 py-3 text-base font-medium"
                leftIcon={<PiReceipt className="h-5 w-5" />}
              >
                مشاهده صورت‌حساب
              </Button>
            )}

            {/* Always show back button */}
            <Button
              onClick={goBack}
              variant="subtle"
              size="lg"
              className="flex-1 py-3 text-base font-medium"
            >
              بازگشت
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


