'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  useLazyGetBillPaymentStatusByTrackingCodeQuery,
  selectBillIsLoading,
} from '@/src/store/bills';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import {
  PiCheckCircle,
  PiReceipt,
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
  params: Promise<{ trackingCode: string; paymentId: string }>;
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trackingCodeFromParams, setTrackingCodeFromParams] = useState<string>('');
  const [paymentIdFromParams, setPaymentIdFromParams] = useState<string>('');
  const [billType, setBillType] = useState<string | null>(null);
  const [billData, setBillData] = useState<{
    billId?: string;
    billNumber?: string;
    billPaidAmount?: number;
    billStatusText?: string;
    billItems?: Array<{
      itemDescription?: string;
      itemName?: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redux selectors
  const isLoadingBill = useSelector(selectBillIsLoading);

  // RTK Query for bill data
  const [getBillPaymentStatusByTrackingCode] = useLazyGetBillPaymentStatusByTrackingCodeQuery();

  // Get tracking code and payment ID from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTrackingCodeFromParams(resolvedParams.trackingCode);
      setPaymentIdFromParams(resolvedParams.paymentId);
    };
    getParams();
  }, [params]);

  // Get billType from query params
  useEffect(() => {
    const billTypeParam = searchParams.get('billType');
    if (billTypeParam) {
      setBillType(billTypeParam);
    }
  }, [searchParams]);

  // Fetch bill data when tracking code is available
  useEffect(() => {
    if (trackingCodeFromParams) {
      const fetchBillData = async () => {
        setIsLoading(true);
        try {
          const result = await getBillPaymentStatusByTrackingCode({
            trackingCode: trackingCodeFromParams,
            billType: billType ?? undefined,
            includeBillItems: true
          }).unwrap();
          
          if (result.result) {
            setBillData(result.result);
          }
        } catch (error) {
          console.error('Error fetching bill data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBillData();
    }
  }, [trackingCodeFromParams, billType, getBillPaymentStatusByTrackingCode]);

  // Event handlers
  const handleBack = () => {
    router.push('/dashboard');
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
            <p><strong>شماره فاکتور:</strong> ${billData?.billNumber || 'نامشخص'}</p>
            <p><strong>مبلغ پرداخت:</strong> <span class="amount">${formatCurrencyFa(billData?.billPaidAmount || 0)} ریال</span></p>
            <p><strong>تاریخ پرداخت:</strong> ${formatDateFa(new Date())}</p>
            <p><strong>وضعیت:</strong> ${billData?.billStatusText || 'پرداخت شده'}</p>
          </div>
          ${billData?.billItems && billData.billItems.length > 0 ? `
          <div class="bill-details">
            <h3>جزئیات فاکتور:</h3>
            <table>
              <thead>
                <tr>
                  <th>شرح</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>مجموع</th>
                </tr>
              </thead>
              <tbody>
                ${billData.billItems.map((item) => `
                  <tr>
                    <td>${item.itemDescription || item.itemName || 'واریز کیف پول'}</td>
                    <td>${item.quantity || 1}</td>
                    <td>${formatCurrencyFa(item.unitPrice || 0)} ریال</td>
                    <td>${formatCurrencyFa(item.totalPrice || 0)} ریال</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
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
          title="رسید پرداخت"
          titleIcon={<PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
          showBackButton
          onBack={handleBack}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                      {billData?.billNumber || 'نامشخص'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">مبلغ پرداخت:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrencyFa(billData?.billPaidAmount || 0)} ریال
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
                      {billData?.billStatusText || 'پرداخت شده'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill Items Summary */}
            {billData?.billItems && billData.billItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  خلاصه فاکتور
                </h3>
                <div className="space-y-3">
                  {billData.billItems.map((item, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.itemDescription || item.itemName || 'واریز کیف پول'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          تعداد: {item.quantity || 1} × {formatCurrencyFa(item.unitPrice || 0)} ریال
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrencyFa(item.totalPrice || 0)} ریال
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {/* Fixed Action Buttons at Bottom */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <Button
              onClick={handleDashboard}
              className="flex-1 py-3 text-base font-medium"
            >
              داشبورد
            </Button>

            <Button
              variant="ghost"
              onClick={printReceipt}
              leftIcon={<PiReceipt className="h-4 w-4" />}
              className="flex-1 py-3 text-base font-medium"
            >
          
              چاپ فاکتور
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

