'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useLazyGetPaymentDetailQuery, selectPaymentsLoading } from '@/src/store/payments';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { PiCheckCircle, PiReceipt, PiArrowLeft } from 'react-icons/pi';
import { PaymentDetailDto } from '@/src/services/Api';

// Utility functions
function formatCurrencyFa(amount: number): string {
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

function formatDateFa(date: Date | string | null): string {
  if (!date) return 'نامشخص';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'نامشخص';

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'نامشخص';
  }
}

interface PaymentSuccessPageProps {
  params: Promise<{ trackingCode: string; paymentId: string }>;
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter();
  const [trackingCodeFromParams, setTrackingCodeFromParams] = useState<string>('');
  const [paymentIdFromParams, setPaymentIdFromParams] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redux selectors
  const isLoadingPayment = useSelector(selectPaymentsLoading);

  // RTK Query for payment detail
  const [getPaymentDetail] = useLazyGetPaymentDetailQuery();

  // Get tracking code and payment ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTrackingCodeFromParams(resolvedParams.trackingCode);
      setPaymentIdFromParams(resolvedParams.paymentId);
    };
    getParams();
  }, [params]);


  // Fetch payment detail (no need to load full bill here)
  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentIdFromParams) return;
      setIsLoading(true);
      try {
        const response = await getPaymentDetail(paymentIdFromParams).unwrap();
        setPaymentData(response?.result || null);
      } catch (error) {
        console.error('Error fetching payment detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayment();
  }, [paymentIdFromParams, getPaymentDetail]);

  // Event handlers
  const handleBack = () => {
    // If came from bill detail page, go back there
    if (document.referrer && document.referrer.includes('/bills/') && !document.referrer.includes('/payments/')) {
      router.back();
    } else {
      // Otherwise go to bills list
      router.push('/bills');
    }
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <html dir="rtl">
        <head>
          <title>رسید پرداخت</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .payment-info { margin-bottom: 20px; }
            .success-icon { color: #10B981; font-size: 48px; margin-bottom: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: #10B981; }
            .bill-details { margin-top: 20px; }
            .bill-details table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .bill-details th, .bill-details td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>پرداخت موفق</h1>
            <p>رسید پرداخت</p>
          </div>
          <div class="payment-info">
            <p><strong>شماره پرداخت:</strong> ${paymentIdFromParams}</p>
            <p><strong>کد پیگیری:</strong> ${trackingCodeFromParams}</p>
            <p><strong>شماره فاکتور:</strong> ${paymentData?.bill?.billNumber || 'نامشخص'}</p>
            <p><strong>مبلغ پرداخت:</strong> <span class="amount">${formatCurrencyFa(paymentData?.amountRials || 0)} ریال</span></p>
            <p><strong>تاریخ پرداخت:</strong> ${formatDateFa(new Date())}</p>
            <p><strong>وضعیت:</strong> ${paymentData?.statusText || paymentData?.status || 'پرداخت شده'}</p>
          </div>
          
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Navigate to reference page based on referenceType
  const handleNavigateToReference = () => {
    const bill = paymentData?.bill;
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
    const bill = paymentData?.bill;
    return !!(bill?.referenceType && bill?.referenceId && 
              (bill.referenceType === 'WalletDeposit' || bill.referenceType === 'TourReservation'));
  };

  const getReferenceButtonText = () => {
    const bill = paymentData?.bill;
    if (bill?.referenceType === 'WalletDeposit') {
      return 'مشاهده واریز';
    } else if (bill?.referenceType === 'TourReservation') {
      return 'مشاهده رزرو';
    }
    return 'مشاهده جزئیات';
  };

  // Loading state
  if (isLoading || isLoadingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title="رسید پرداخت"
          titleIcon={<PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
          showBackButton
          onBack={handleBack}
        />

        {/* Loading Content */}
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="رسید پرداخت"
          titleIcon={<PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
          showBackButton
          onBack={handleBack}
        />

        {/* Scrollable Content */}
        <ScrollableArea className="flex-1" hideScrollbar={true}>
          <div className="p-4 space-y-4">
            {/* Success Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
              <div className="flex justify-center mb-4">
                <PiCheckCircle className="h-16 w-16 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                پرداخت موفق
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                پرداخت شما با موفقیت انجام شد
              </p>

            {/* Payment Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">شماره پرداخت:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                      {paymentIdFromParams}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">کد پیگیری:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                      {trackingCodeFromParams}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">شماره فاکتور:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {paymentData?.bill?.billNumber || 'نامشخص'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">مبلغ پرداخت:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrencyFa(paymentData?.amountRials || 0)} ریال
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ پرداخت:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDateFa(new Date())}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">وضعیت:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {paymentData?.statusText || paymentData?.status || 'پرداخت شده'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

       

            {/* Additional Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <PiCheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    اطلاعات مهم
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    رسید پرداخت شما ذخیره شده است. در صورت نیاز می‌توانید آن را چاپ یا دانلود کنید.
                    همچنین می‌توانید فاکتور مربوطه را مشاهده کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollableArea>

        {/* Fixed Action Buttons at Bottom */}
        <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-10">
          <div className="flex gap-3">
            {canNavigateToReference() && (
              <Button
                variant="primary"
                onClick={handleNavigateToReference}
                leftIcon={<PiArrowLeft className="h-5 w-5" />}
                className="flex-1 py-3 text-base font-medium"
              >
                {getReferenceButtonText()}
              </Button>
            )}
            
            <Button
              variant={canNavigateToReference() ? "secondary" : "primary"}
              onClick={handleDashboard}
              className="flex-1 py-3 text-base font-medium"
            >
              داشبورد
            </Button>

            <Button
              variant="ghost"
              onClick={printReceipt}
              leftIcon={<PiReceipt className="h-4 w-4" />}
              className={canNavigateToReference() ? "flex-1 py-3 text-base font-medium" : "hidden"}
            >
              چاپ فاکتور
            </Button>
          </div>
        </div>
      </div>
  );
}

