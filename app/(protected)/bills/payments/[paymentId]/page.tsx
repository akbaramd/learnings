'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useLazyGetPaymentDetailQuery,
  selectCurrentPayment,
} from '@/src/store/payments';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  PiCreditCard,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiReceipt,
  PiArrowLeft,
} from 'react-icons/pi';
import { PaymentDetailDto } from '@/src/services/Api';

// Utility functions
function formatCurrencyFa(amount?: number | null): string {
  if (amount == null || isNaN(amount)) return '۰';
  return new Intl.NumberFormat('fa-IR').format(amount);
}

function formatDateFa(date?: string | Date | null): string {
  if (!date) return 'نامشخص';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'نامشخص';
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'نامشخص';
  }
}

function getStatusIcon(status: string | null | undefined) {
  switch (status) {
    case 'Completed':
    case 'PaidFromWallet':
      return <PiCheckCircle className="h-5 w-5 text-green-500" />;
    case 'Processing':
    case 'Pending':
      return <PiClock className="h-5 w-5 text-amber-500" />;
    case 'Failed':
      return <PiXCircle className="h-5 w-5 text-red-500" />;
    case 'Expired':
      return <PiWarning className="h-5 w-5 text-orange-500" />;
    case 'Cancelled':
      return <PiXCircle className="h-5 w-5 text-gray-500" />;
    case 'Refunded':
      return <PiWarning className="h-5 w-5 text-purple-500" />;
    default:
      return <PiWarning className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'Pending': 'در انتظار',
    'Processing': 'در حال پردازش',
    'Completed': 'تکمیل شده',
    'PaidFromWallet': 'پرداخت از کیف پول',
    'Failed': 'ناموفق',
    'Cancelled': 'لغو شده',
    'Expired': 'منقضی شده',
    'Refunded': 'مسترد شده'
  };
  return labels[status || ''] || status || 'نامشخص';
}

function getStatusBadgeClass(status: string | null | undefined) {
  const badgeMap: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'PaidFromWallet': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Processing': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    'Pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Expired': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    'Cancelled': 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
    'Refunded': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  };
  return badgeMap[status || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
}

interface InfoRowProps {
  label: string;
  value?: string | number | null;
  highlight?: boolean;
}

function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}:</span>
      <span className={`text-sm font-medium font-mono ${highlight ? 'text-green-600 dark:text-green-400 text-base' : 'text-gray-900 dark:text-gray-100'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

interface PaymentDetailPageProps {
  params: Promise<{ paymentId: string }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentDetailDto | null>(null);
  const [getPaymentDetail, { isLoading, isFetching }] = useLazyGetPaymentDetailQuery();
  const paymentFromRedux = useSelector(selectCurrentPayment);

  // Load route params
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setPaymentId(resolved.paymentId);
    };
    resolveParams();
  }, [params]);

  // Fetch payment detail
  useEffect(() => {
    if (!paymentId) return;
    const fetchData = async () => {
      try {
        const result = await getPaymentDetail(paymentId).unwrap();
        console.log('Payment detail response:', result);
        if (result?.result) {
          setPaymentData(result.result);
        } else {
          console.warn('Payment detail response has no result:', result);
        }
      } catch (err) {
        console.error('Error fetching payment detail:', err);
      }
    };
    fetchData();
  }, [paymentId, getPaymentDetail]);

  // Use payment data from query result, fallback to Redux
  const payment: PaymentDetailDto | null = paymentData || paymentFromRedux;
  const isLoadingPayment = isLoading || isFetching;

  const handleBack = () => {
    if (document.referrer && document.referrer.includes('/bills/payments')) {
      router.back();
    } else {
      router.push('/bills/payments');
    }
  };

  const handleViewBill = () => {
    if (payment?.bill?.referenceTrackingCode) {
      router.push(`/bills/${payment.bill.referenceTrackingCode}`);
    } else if (payment?.billId) {
      router.push(`/bills/${payment.billId}`);
    }
  };

  // Navigate to reference page based on referenceType
  const handleNavigateToReference = () => {
    const bill = payment?.bill;
    if (!bill?.referenceType || !bill?.referenceId) return;

    const referenceType = bill.referenceType;
    const referenceId = bill.referenceId;

    if (referenceType === 'WalletDeposit') {
      router.push(`/wallet/default/deposits/${referenceId}`);
    } else if (referenceType === 'TourReservation') {
      router.push(`/tours/reservations/${referenceId}`);
    }
  };

  // Check if we can navigate to reference
  const canNavigateToReference = () => {
    const bill = payment?.bill;
    return !!(bill?.referenceType && bill?.referenceId && 
              (bill.referenceType === 'WalletDeposit' || bill.referenceType === 'TourReservation'));
  };

  const getReferenceButtonText = () => {
    const bill = payment?.bill;
    if (bill?.referenceType === 'WalletDeposit') {
      return 'مشاهده واریز';
    } else if (bill?.referenceType === 'TourReservation') {
      return 'مشاهده رزرو';
    }
    return 'مشاهده جزئیات';
  };

  if (isLoadingPayment && !payment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title="جزئیات پرداخت"
          titleIcon={<PiCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          showBackButton
          onBack={handleBack}
        />
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Header */}
      <PageHeader
        title="جزئیات پرداخت"
        titleIcon={<PiCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton
        onBack={handleBack}
      />

      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="p-4 space-y-4">
          {/* Payment Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(payment?.status)}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    پرداخت #{payment?.paymentId?.substring(0, 8)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateFa(payment?.createdAt)}
                  </p>  
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(payment?.status)}`}>
                {getStatusLabel(payment?.status)}
              </span>
            </div>

            {payment?.status === 'Failed' && payment?.failureReason && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>علت خطا:</strong> {payment?.failureReason}
                </p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              اطلاعات پرداخت
            </h3>
            <div className="space-y-1">
              <InfoRow label="شناسه پرداخت" value={payment?.paymentId} />
              <InfoRow label="مبلغ پرداخت" value={`${formatCurrencyFa(payment?.amountRials || 0)} ریال`} highlight={true} />
              <InfoRow label="وضعیت" value={payment?.statusText || getStatusLabel(payment?.status)} />
              <InfoRow label="روش پرداخت" value={payment?.methodText || '—'} />
              <InfoRow label="درگاه پرداخت" value={payment?.gatewayText || '—'} />
              {payment?.gatewayReference && (
                <InfoRow label="کد پیگیری درگاه" value={payment?.gatewayReference} />
              )}
              {payment?.gatewayTransactionId && (
                <InfoRow label="شناسه تراکنش درگاه" value={payment?.gatewayTransactionId} />
              )}
              <InfoRow label="تاریخ ایجاد" value={formatDateFa(payment?.createdAt)} />
              {payment?.completedAt && (
                <InfoRow label="تاریخ تکمیل" value={formatDateFa(payment?.completedAt)} />
              )}
              {payment?.expiryDate && (
                <InfoRow label="تاریخ انقضا" value={formatDateFa(payment?.expiryDate)} />
              )}
              {payment?.appliedDiscountCode && (
                <InfoRow label="کد تخفیف" value={payment?.appliedDiscountCode} />
              )}
              {payment?.appliedDiscountAmountRials && (
                <InfoRow label="مبلغ تخفیف" value={`${formatCurrencyFa(payment?.appliedDiscountAmountRials)} ریال`} />
              )}
              {payment?.isFreePayment && (   
                <InfoRow label="پرداخت رایگان" value="بله" />
              )}
            </div>
          </div>

          {/* Bill Information */}
          {payment?.bill && (    
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                اطلاعات صورت حساب
              </h3>
              <div className="space-y-1">
                <InfoRow label="شماره فاکتور" value={payment?.bill?.billNumber || '—'} />
                <InfoRow label="عنوان" value={payment?.bill?.title || '—'} />
                <InfoRow label="کد پیگیری" value={payment?.bill?.referenceTrackingCode || '—'} />
                <InfoRow label="وضعیت" value={payment?.bill?.statusText || payment?.bill?.status || '—'} />
                <InfoRow label="مبلغ کل" value={`${formatCurrencyFa(payment?.bill?.totalAmountRials || 0)} ریال`} />
                <InfoRow label="مبلغ پرداخت شده" value={`${formatCurrencyFa(payment?.bill?.paidAmountRials || 0)} ریال`} />
                <InfoRow label="مانده" value={`${formatCurrencyFa(payment?.bill?.remainingAmountRials || 0)} ریال`} />
              </div>
            </div>
          )}

          {/* Transactions */}
          {payment?.transactions && payment?.transactions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                تراکنش‌ها
              </h3>
              <div className="space-y-3">
                {payment?.transactions.map((transaction, index) => (
                  <div key={transaction.transactionId || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoRow label="شناسه تراکنش" value={transaction.transactionId} />
                      <InfoRow label="مبلغ" value={`${formatCurrencyFa(transaction.amountRials || 0)} ریال`} />
                      <InfoRow label="وضعیت" value={transaction.statusText || transaction.status || '—'} />
                      <InfoRow label="درگاه" value={transaction.gateway || '—'} />
                      <InfoRow label="شناسه تراکنش درگاه" value={transaction.gatewayTransactionId || '—'} />
                      <InfoRow label="کد پیگیری درگاه" value={transaction.gatewayReference || '—'} />
                      <InfoRow label="تاریخ" value={formatDateFa(transaction.createdAt)} />
                      {transaction.note && (
                        <InfoRow label="یادداشت" value={transaction.note} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollableArea>

      {/* Sticky Footer */}
      <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
        <div className="flex gap-3">
          {payment?.bill && (
            <Button
              variant="primary"
              onClick={handleViewBill}
              leftIcon={<PiReceipt className="h-5 w-5" />}
              className="flex-1 py-3 text-base font-medium"
            >
              مشاهده صورت حساب
            </Button>
          )}
          
          {canNavigateToReference() && (
            <Button
              variant="secondary"
              onClick={handleNavigateToReference}
              leftIcon={<PiArrowLeft className="h-5 w-5" />}
              className="flex-1 py-3 text-base font-medium"
            >
              {getReferenceButtonText()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

