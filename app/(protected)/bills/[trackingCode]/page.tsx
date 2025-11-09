'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  BillItem, 
  useLazyGetBillDetailsByTrackingCodeQuery,
  selectBillIsLoading,
  BillDetail,
} from '@/src/store/bills';
import {
  useValidateDiscountCodeMutation,
  ValidateDiscountCodeResponse,
} from '@/src/store/discounts';
import {
  handlePaymentsApiError,
  useCreatePaymentMutation,
} from '@/src/store/payments';
import { useToast } from '@/src/hooks/useToast';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { InputField } from '@/src/components/forms/InputField';
import {
  PiReceipt,
  PiCheckCircle,
  PiXCircle,
  PiClock,
  PiWarning,
  PiCreditCard,
  PiWallet,
  PiSpinner,
  PiTrash,
  PiArrowClockwise,
} from 'react-icons/pi';
import {usePayWithWalletMutation} from "@/src/store/wallets";

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

interface BillDetailPageProps {
  params: Promise<{ trackingCode: string }>;
}

export default function BillDetailPage({ params }: BillDetailPageProps) {
  const router = useRouter();

  
  const [trackingCodeFromParams, setTrackingCodeFromParams] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'online' | 'wallet' | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [isDiscountValidating, setIsDiscountValidating] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<ValidateDiscountCodeResponse | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Redux selectors
  const isLoading = useSelector(selectBillIsLoading);
  
  // Toast hook
  const { success, error: showError } = useToast();
  
  // API mutations
  const [validateDiscountCode] = useValidateDiscountCodeMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [payWithWallet] = usePayWithWalletMutation();

  // Get tracking code and bill type from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setTrackingCodeFromParams(resolvedParams.trackingCode);
    };
    getParams();
    

  }, [params]);

  // RTK Query for bill data - using lazy query
  const [getBillDetailsByTrackingCode, { 
    data: billResponse, 
    error: queryError,
    isLoading: queryLoading,
  }] = useLazyGetBillDetailsByTrackingCodeQuery();

  // Load bill data when tracking code is available
  useEffect(() => {
    if (trackingCodeFromParams ) {
      getBillDetailsByTrackingCode({
        trackingCode: trackingCodeFromParams
      });
    }
  }, [trackingCodeFromParams, getBillDetailsByTrackingCode]);

  // Get bill detail from response
  const bill: BillDetail | null = billResponse?.data || null;
  const billItems = bill?.items || [];
  const billId = bill?.id || '';
  
  const totalAmount = bill?.totalAmountRials || 0;

  const paidAmount = bill?.paidAmountRials || 0;

  // Calculate discount amount
  const discountAmount = appliedDiscount?.discountAmountRials || 0;
  
  // Calculate amounts after discount
  const amountAfterDiscount = Math.max(0, totalAmount - discountAmount);
  const remainingAmount = Math.max(0, amountAfterDiscount - paidAmount);

  const paymentAmount = remainingAmount;

  // Check if bill is fully paid using multiple indicators
  const isBillFullyPaid = !!(bill?.isPaid || bill?.status?.toLowerCase() === 'paid' || bill?.status?.toLowerCase() === 'completed');

  const isWalletPaymentAvailable = selectedPaymentMethod === 'wallet';
  const isPaymentMethodSelected = selectedPaymentMethod !== null;
  
  // Check if this is a WalletDeposit bill
  const isWalletDeposit = bill?.referenceType === 'WalletDeposit';
  const showWalletPayment = !isWalletDeposit;

  const hasSufficientBalance = (() => {
    // Mock wallet balance - replace with actual wallet balance
    const walletBalance = 2000000;
    return walletBalance >= paymentAmount;
  })();

  const isInsufficientBalance = isWalletPaymentAvailable && !hasSufficientBalance && paymentAmount > 0;

  const canApplyDiscount = !isBillFullyPaid && discountCodeInput.trim().length > 0;

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <PiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'unpaid':
        return <PiClock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <PiXCircle className="h-5 w-5 text-red-500" />;
      default:
        return <PiWarning className="h-5 w-5 text-gray-500" />;
    }
  };


  const getStatusBadgeClass = (status: string) => {
    const badgeMap: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return badgeMap[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  // Event handlers
  const handleBack = () => {
    // Check if came from bills list page
    if (document.referrer && document.referrer.includes('/bills') && !document.referrer.includes('/bills/')) {
      router.back(); // Go back to bills list
    } else if (document.referrer && !document.referrer.includes('/bills')) {
      router.back(); // Go back to previous page if it's not a bills page
    } else {
      // Default: go to bills list
      router.push('/bills');
    }
  };

  const handleRefresh = () => {
    if (trackingCodeFromParams ) {
      getBillDetailsByTrackingCode({
        trackingCode: trackingCodeFromParams
      });
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    setDiscountError('');
    setDiscountSuccess('');
    success('تخفیف حذف شد', 'کد تخفیف با موفقیت حذف شد');
  };

  const handleDiscountValidation = async () => {
    if (!discountCodeInput.trim() || !bill?.id) return;
    
    setIsDiscountValidating(true);
    setDiscountError('');
    setDiscountSuccess('');
    
    try {
      const result = await validateDiscountCode({
        billId: bill.id!,
        discountCode: discountCodeInput.trim(),
      }).unwrap();
      
      if (result.data?.isValid) {
        setAppliedDiscount(result.data);
        setDiscountSuccess('کد تخفیف اعمال شد');
        success('کد تخفیف اعمال شد', `تخفیف ${formatCurrencyFa(result.data.discountAmountRials || 0)} ریال اعمال شد`);
      } else {
        setDiscountError(result.data?.errors?.[0] || result.errors?.[0] || 'کد تخفیف نامعتبر است');
        setAppliedDiscount(null);
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('خطا در اعتبارسنجی کد تخفیف');
      setAppliedDiscount(null);
      showError('خطا در اعتبارسنجی کد تخفیف', 'لطفاً دوباره تلاش کنید');
    } finally {
      setIsDiscountValidating(false);
    }
  };

  const processPayment = async () => {
    if (!bill?.id || !selectedPaymentMethod) return;
    
    setIsProcessingPayment(true);
    
    try {
      if (selectedPaymentMethod === 'wallet') {
        // Pay with wallet
        const walletResult = await payWithWallet({
            billId: bill.id!,
            // Send full, non-discounted remaining amount; backend will validate/apply discounts
            amount: Math.max(0, (bill.totalAmountRials || 0) - (bill.paidAmountRials || 0)),
            description: `پرداخت فاکتور ${bill.billNumber || bill.id}`,
            paymentId: bill.id!
        });
        if (walletResult.data) {
          // Check if payment was successful
          if (walletResult.data.result?.paymentId) {
            success('پرداخت موفق', 'فاکتور با موفقیت پرداخت شد');
            // Redirect to payment success page with tracking code and payment ID
            router.push(`/bills/${trackingCodeFromParams}/payments/success/${walletResult.data.result.paymentId}`);
            return;
          } else {
            success('پرداخت جزئی', 'مبلغ پرداخت شد اما فاکتور هنوز کامل پرداخت نشده است');
            handleRefresh();
          }
        } else {
          throw new Error(walletResult.data);
        }
      } else {
        // Create online payment
        const paymentResult = await createPayment({
          billId: bill.id!,
          // Send full, non-discounted remaining amount; backend validates discountCode
          amountRials: Math.max(0, totalAmount - paidAmount),
          paymentMethod: 'online',
          paymentGateway: "Parsian", // Will be selected by backend
          callbackUrl: `${window.location.origin}/bills/${trackingCodeFromParams}/payments/success/{paymentId}?billType=${isWalletDeposit ? 'WalletDeposit' : 'Bill'}`,
          description: `پرداخت فاکتور ${bill.billNumber || bill.id}`,
          expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          autoIssueBill: paymentAmount > 0,
          discountCode: appliedDiscount?.discountCode?.code || undefined,
          allowOverDiscount: paymentAmount === 0,
          skipPaymentIfZero: paymentAmount > 0,
        }).unwrap();
        
        if (paymentResult.result) {
          const result = paymentResult.result;
          
          // Check if payment was skipped (zero amount)
          if (result.paymentSkipped || result.isFreePayment) {
            success('پرداخت موفق', 'فاکتور با موفقیت پرداخت شد');
            router.push(`/bills/${trackingCodeFromParams}/payments/success/${result.paymentId}`);
            return;
          }
          
          // Check if redirect is required
          if (result.requiresRedirect && result.gatewayRedirectUrl) {
            // Redirect to payment gateway
            window.location.href = result.gatewayRedirectUrl;
            return;
          }
          
          // If no redirect required, check if fully paid
          if (result.billStatus === 'paid') {
            success('پرداخت موفق', 'فاکتور با موفقیت پرداخت شد');
            router.push(`/bills/${trackingCodeFromParams}/payments/success/${result.paymentId}`);
            return;
          }
          
          // Show payment message if available
          if (result.paymentMessage) {
            success('پرداخت ایجاد شد', result.paymentMessage);
          }
          
          handleRefresh();
        } else {
          throw new Error(paymentResult.errors?.[0] || 'خطا در ایجاد پرداخت');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = handlePaymentsApiError(error);
      showError('خطا در پرداخت', errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <html dir="rtl">
        <head>
          <title>فاکتور پرداخت</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .bill-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>فاکتور پرداخت</h1>
            <p>کد پیگیری: ${trackingCodeFromParams}</p>
          </div>
          <div class="bill-info">
            <p>تاریخ: ${formatDateFa(new Date())}</p>
            <p>وضعیت: ${bill?.statusText || bill?.status}</p>
            <p>شماره فاکتور: ${bill?.billNumber || 'نامشخص'}</p>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>شرح</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              ${billItems.map((item: BillItem) => `
                <tr>
                  <td>${item.description || item.title || 'واریز کیف پول'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${formatCurrencyFa(item.unitPriceRials || 0)} ریال</td>
                  <td>${formatCurrencyFa(item.lineTotalRials || 0)} ریال</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>مجموع: ${formatCurrencyFa(totalAmount)} ریال</p>
            <p>پرداخت شده: ${formatCurrencyFa(paidAmount)} ریال</p>
            <p>مانده: ${formatCurrencyFa(remainingAmount)} ریال</p>
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

  // Auto-select online payment for WalletDeposit bills or free payments
  useEffect(() => {
    if (!selectedPaymentMethod) {
      if (isWalletDeposit || paymentAmount === 0) {
        setSelectedPaymentMethod('online');
      }
    }
  }, [isWalletDeposit, paymentAmount, selectedPaymentMethod]);

  // Clear discount validation when bill changes
  useEffect(() => {
    setDiscountError('');
    setDiscountSuccess('');
  }, [bill?.id]);

  // Handle API errors
  useEffect(() => {
    if (queryError) {
      console.error('API Error:', queryError);
    }
  }, [queryError]);

  // Loading state - use Redux state or query loading
  const isCurrentlyLoading = isLoading || queryLoading;

  // Loading state
  if (isCurrentlyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title="صورت حساب"
          titleIcon={<PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle={`${trackingCodeFromParams.slice(0, 8)}...`}
          showBackButton
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiCreditCard className="h-4 w-4" />,
              onClick: () => {
                if (bill?.id) {
                  router.push(`/bills/${trackingCodeFromParams}/payments?billId=${bill.id}`);
                }
              },
              label: 'پرداخت‌ها',
              'aria-label': 'مشاهده پرداخت‌های این فاکتور',
            },
            {
              icon: <PiArrowClockwise className="h-4 w-4" />,
              onClick: handleRefresh,
              label: 'تازه‌سازی',
              'aria-label': 'تازه‌سازی',
            },
          ]}
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

  // No bill found
  if (!bill && !isCurrentlyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageHeader
          title="صورت حساب"
          titleIcon={<PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle={`${trackingCodeFromParams.slice(0, 8)}...`}
          showBackButton
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiArrowClockwise className="h-4 w-4" />,
              onClick: handleRefresh,
              label: 'تازه‌سازی',
              'aria-label': 'تازه‌سازی',
            },
          ]}
        />

        {/* No Results Content */}
        <div className="p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <PiReceipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
              فاکتور یافت نشد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              فاکتور با کد پیگیری {trackingCodeFromParams} یافت نشد
            </p>
            <div className="space-y-2">
              <Button onClick={handleRefresh} className="w-full">
                <PiSpinner className="h-4 w-4 mr-2" />
                تلاش مجدد
              </Button>
              <Button onClick={handleBack} variant="outline" className="w-full">
                بازگشت
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only render if bill exists
  if (!bill) return null;

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
        <PageHeader
          title="صورت حساب"
          titleIcon={<PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          subtitle={`${trackingCodeFromParams.slice(0, 8)}...`}
          showBackButton
          onBack={handleBack}
          rightActions={[
            {
              icon: <PiCreditCard className="h-4 w-4" />,
              onClick: () => {
                if (billId) {
                  router.push(`/bills/${trackingCodeFromParams}/payments?billId=${billId}`);
                }
              },
              label: 'پرداخت‌ها',
              'aria-label': 'مشاهده پرداخت‌های این فاکتور',
            },
            {
              icon: <PiArrowClockwise className="h-4 w-4" />,
              onClick: handleRefresh,
              label: 'تازه‌سازی',
              'aria-label': 'تازه‌سازی',
            },
          ]}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Bill Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(bill.status || '')}
              <div>
                <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  {isBillFullyPaid ? 'صورت حساب‌ها' : 'مشخصات فاکتور'}
                </h2>
                </div>
                </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(bill.status || '')}`}>
              {bill.statusText || bill.status}
            </span>
              </div>
              
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">شماره فاکتور:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {bill.billNumber || 'نامشخص'}
              </span>
              </div>
              
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">کد پیگیری:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                {bill.referenceTrackingCode || trackingCodeFromParams}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">مجموع مبلغ:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatCurrencyFa(bill.totalAmountRials || 0)} ریال
              </span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">تخفیف:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  -{formatCurrencyFa(discountAmount)} ریال
                </span>
              </div>
            )}
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">مبلغ پس از تخفیف:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrencyFa(amountAfterDiscount)} ریال
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">پرداخت شده:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrencyFa(paidAmount)} ریال
              </span>
                </div>

            {remainingAmount >= 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {remainingAmount === 0 ? 'مبلغ قابل پرداخت:' : 'مانده قابل پرداخت:'}
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {remainingAmount === 0 ? 'رایگان' : `${formatCurrencyFa(remainingAmount)} ریال`}
                </span>
              </div>
            )}
            
            {isBillFullyPaid && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">وضعیت:</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  کاملاً پرداخت شده
                </span>
              </div>
            )}
          </div>
                </div>
                
                {/* Fully Paid Message */}
                {isBillFullyPaid && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <PiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                          فاکتور پرداخت شده
                        </h3>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                          این فاکتور به طور کامل پرداخت شده است. می‌توانید رسید خود را چاپ یا ذخیره کنید.
                        </p>
                        <Button
                          onClick={() => router.push('/bills')}
                          variant="solid"
                          size="sm"
                          className="w-full"
                          leftIcon={<PiReceipt className="h-4 w-4" />}
                        >
                          برو به صورت حساب‌ها
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
        {/* Bill Items */}
        {billItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              جزئیات فاکتور
                  </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-2/5">شرح</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/6">تعداد</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/6">قیمت واحد</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/6">مجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item: BillItem, index: number) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <td className="py-3 px-4 w-2/5">
                        <div className="flex items-center gap-2">
                          <PiReceipt className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                            {item.description || item.title || 'واریز کیف پول'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-gray-900 dark:text-gray-100 w-1/6">
                        {item.quantity || 1}
                      </td>
                      <td className="text-left py-3 px-4 text-gray-900 dark:text-gray-100 w-1/6">
                        {formatCurrencyFa(item.unitPriceRials || 0)} ریال
                      </td>
                      <td className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-1/6">
                        {formatCurrencyFa(item.lineTotalRials || 0)} ریال
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>
            )}

        {/* Discount Code Section */}
        {!isBillFullyPaid && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              کد تخفیف
                  </h3>
            <div className="space-y-3">
              {amountAfterDiscount === 0 ? (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>مبلغ صورت‌حساب پس از اعمال تخفیف، صفر است.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      aria-label="لغو تخفیف"
                    >
                      لغو تخفیف
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <InputField
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    placeholder={appliedDiscount ? "کد تخفیف اعمال شده" : "کد تخفیف را وارد کنید"}
                    className="flex-1"
                    disabled={!!appliedDiscount}
                  />
                  <Button
                    variant={appliedDiscount ? 'outline' : (canApplyDiscount ? 'solid' : 'outline')}
                    color={appliedDiscount ? 'secondary' : (canApplyDiscount ? 'primary' : 'secondary')}
                    disabled={!discountCodeInput.trim() || isDiscountValidating}
                    onClick={appliedDiscount ? handleRemoveDiscount : handleDiscountValidation}
                    className="px-3"
                  >
                    {isDiscountValidating ? (
                      <PiSpinner className="h-4 w-4 animate-spin" />
                    ) : appliedDiscount ? (
                      <PiTrash className="h-4 w-4" />
                    ) : (
                      <PiCheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
              
              {discountError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <PiWarning className="h-4 w-4" />
                  {discountError}
                </div>
              )}
              
              {discountSuccess && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <PiCheckCircle className="h-4 w-4" />
                  {discountSuccess}
                  {appliedDiscount && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (کد: {appliedDiscount.discountCode?.code})
                    </span>
                  )}
                </div>
              )}
              </div>
          </div>
        )}

        {/* Payment Method Selection (hidden if free) */}
        {!isBillFullyPaid && amountAfterDiscount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              روش پرداخت
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={selectedPaymentMethod === 'online'}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as 'online' | 'wallet')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <PiCreditCard className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">پرداخت آنلاین</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {paymentAmount === 0 ? 'پرداخت رایگان' : 'پرداخت از طریق درگاه بانکی'}
                  </p>
                </div>
              </label>

              {showWalletPayment && (
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={selectedPaymentMethod === 'wallet'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as 'online' | 'wallet')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <PiWallet className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">پرداخت از کیف پول</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {paymentAmount === 0 ? 'پرداخت رایگان' : `موجودی: ${formatCurrencyFa(2000000)} ریال`}
                    </p>
                  </div>
                </label>
              )}

              {isInsufficientBalance && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <PiWarning className="h-4 w-4" />
                    موجودی کیف پول کافی نیست
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    برای پرداخت این فاکتور به {formatCurrencyFa(paymentAmount)} ریال نیاز دارید، 
                    اما موجودی شما {formatCurrencyFa(2000000)} ریال است.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {/* Handle wallet charge */}}
                  >
                    افزایش موجودی کیف پول
                  </Button>
          </div>
        )}
            </div>
          </div>
        )}

          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            {!isBillFullyPaid && (
              <Button
                onClick={processPayment}
                disabled={isInsufficientBalance || !isPaymentMethodSelected || isProcessingPayment}
                className="flex-1 py-3 text-base font-medium"
              >
                {isProcessingPayment ? (
                  <>
                    <PiSpinner className="h-4 w-4 mr-2 animate-spin" />
                    در حال پردازش...
                  </>
                ) : paymentAmount === 0 ? (
                  'تکمیل پرداخت (رایگان)'
                ) : (
                  `پرداخت ${formatCurrencyFa(paymentAmount)} ریال`
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={printInvoice}
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