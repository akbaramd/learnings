'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  useLazyGetBillPaymentStatusByTrackingCodeQuery,
  selectBillIsLoading,
} from '@/src/store/bills';
import { Button } from '@/src/components/ui/Button';
import { IconButton } from '@/src/components/ui/IconButton';
import {
  PiCheckCircle,
  PiReceipt,
  PiArrowLeft,
  PiDownload,
} from 'react-icons/pi';

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
  params: Promise<{ paymentId: string }>;
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter();
  const [paymentIdFromParams, setPaymentIdFromParams] = useState<string>('');
  const [paymentData, setPaymentData] = useState<{
    paymentId: string;
    billId: string;
    amount: number;
    status: string;
    createdAt: string;
    billStatus: string;
    billTotalAmount: number;
    isFullyPaid: boolean;
    trackingCode: string;
    billNumber: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redux selectors
  const isLoadingBill = useSelector(selectBillIsLoading);

  // RTK Query for bill data
  const [getBillPaymentStatusByTrackingCode] = useLazyGetBillPaymentStatusByTrackingCodeQuery();

  // Get payment ID from params
  useEffect(() => {
    const getPaymentId = async () => {
      const resolvedParams = await params;
      setPaymentIdFromParams(resolvedParams.paymentId);
    };
    getPaymentId();
  }, [params]);

  // Mock payment data fetch - replace with actual API call
  useEffect(() => {
    if (paymentIdFromParams) {
      const fetchPaymentData = async () => {
        setIsLoading(true);
        try {
          // Mock payment data - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockPaymentData = {
            paymentId: paymentIdFromParams,
            billId: 'bill-123',
            amount: 500000,
            status: 'completed',
            createdAt: new Date().toISOString(),
            billStatus: 'paid',
            billTotalAmount: 500000,
            isFullyPaid: true,
            trackingCode: 'TRK123456789',
            billNumber: 'INV-2024-001',
          };
          
          setPaymentData(mockPaymentData);
          
          // If we have tracking code, fetch bill details
          if (mockPaymentData.trackingCode) {
            getBillPaymentStatusByTrackingCode({
              trackingCode: mockPaymentData.trackingCode,
              includeBillItems: true
            });
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPaymentData();
    }
  }, [paymentIdFromParams, getBillPaymentStatusByTrackingCode]);

  // Event handlers
  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleViewBill = () => {
    if (paymentData?.trackingCode) {
      router.push(`/bills/${paymentData.trackingCode}`);
    }
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download
    console.log('Download receipt for payment:', paymentIdFromParams);
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
            <p><strong>شماره فاکتور:</strong> ${paymentData?.billNumber || 'نامشخص'}</p>
            <p><strong>مبلغ پرداخت:</strong> <span class="amount">${formatCurrencyFa(paymentData?.amount || 0)} ریال</span></p>
            <p><strong>تاریخ پرداخت:</strong> ${formatDateFa(paymentData?.createdAt || null)}</p>
            <p><strong>وضعیت:</strong> ${paymentData?.status === 'completed' ? 'تکمیل شده' : 'نامشخص'}</p>
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

  // Loading state
  if (isLoading || isLoadingBill) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Breadcrumb Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <IconButton
                aria-label="بازگشت"
                onClick={handleBack}
                variant="ghost"
              >
                <PiArrowLeft className="h-4 w-4" />
              </IconButton>
              <div className="flex items-center gap-2">
                <PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">رسید پرداخت</span>
              </div>
            </div>
          </div>
        </div>

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Breadcrumb Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
              <PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">رسید پرداخت</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Content */}
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
                <span className="text-sm text-gray-500 dark:text-gray-400">شماره فاکتور:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {paymentData?.billNumber || 'نامشخص'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">مبلغ پرداخت:</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrencyFa(paymentData?.amount || 0)} ریال
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">تاریخ پرداخت:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDateFa(paymentData?.createdAt || null)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">وضعیت:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {paymentData?.status === 'completed' ? 'تکمیل شده' : 'نامشخص'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleViewBill}
              className="w-full py-3 text-base font-medium"
            >
              <PiReceipt className="h-4 w-4 mr-2" />
              مشاهده فاکتور
            </Button>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={printReceipt}
                className="flex-1 py-3 text-base font-medium"
              >
                چاپ رسید
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleDownloadReceipt}
                className="flex-1 py-3 text-base font-medium"
              >
                <PiDownload className="h-4 w-4 mr-2" />
                دانلود رسید
              </Button>
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
    </div>
  );
}
