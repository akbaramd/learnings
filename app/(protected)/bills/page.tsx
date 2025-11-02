'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { useToast } from '@/src/hooks/useToast';
import {
  useLazyGetUserBillsQuery,
  selectBillIsLoading,
  selectBills,
  selectBillPaginationInfo,
  type Bill,
} from '@/src/store/bills';
import {
  PiReceipt,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiArrowClockwise,
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'FullyPaid':
      return <PiCheckCircle className="h-5 w-5 text-green-500" />;
    case 'PartiallyPaid':
      return <PiClock className="h-5 w-5 text-amber-500" />;
    case 'Issued':
    case 'Draft':
      return <PiClock className="h-5 w-5 text-blue-500" />;
    case 'Overdue':
      return <PiWarning className="h-5 w-5 text-red-500" />;
    case 'Cancelled':
    case 'Refunded':
      return <PiXCircle className="h-5 w-5 text-red-500" />;
    default:
      return <PiWarning className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'Draft': 'پیش‌نویس',
    'Issued': 'صادر شده',
    'PartiallyPaid': 'پرداخت جزئی',
    'FullyPaid': 'پرداخت کامل',
    'Overdue': 'پس‌افتاده',
    'Cancelled': 'لغو شده',
    'Refunded': 'مسترد شده'
  };
  return labels[status] || status || 'نامشخص';
}

function getStatusBadgeClass(status: string) {
  const badgeMap: Record<string, string> = {
    'FullyPaid': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'PartiallyPaid': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    'Issued': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Cancelled': 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
    'Refunded': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  };
  return badgeMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
}

function getBillCardClass(bill: Bill) {
  const baseClass = "bg-white dark:bg-gray-800 rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer";

  const status = bill.status || '';
  const isFullyPaid = status === 'FullyPaid';
  const isPartialPaid = status === 'PartiallyPaid';
  const isIssued = status === 'Issued' || status === 'Draft';
  const isOverdue = status === 'Overdue';
  const isCancelled = status === 'Cancelled' || status === 'Refunded';

  if (isCancelled) {
    // لغو شده → خاکستری و کمرنگ
    return `${baseClass} border-gray-300 dark:border-gray-600 opacity-60 grayscale hover:opacity-80`;
  }

  if (isFullyPaid) {
    // پرداخت کامل → سبز کمرنگ
    return `${baseClass} border-green-200 dark:border-green-800 opacity-80 hover:opacity-100 hover:border-green-300`;
  }

  if (isOverdue) {
    // پس‌افتاده → قرمز با تاکید
    return `${baseClass} border-red-300 dark:border-red-700 shadow-md ring-2 ring-red-200 dark:ring-red-900/50 hover:shadow-lg hover:scale-[1.01]`;
  }

  if (isPartialPaid) {
    // پرداخت جزئی → زرد با تاکید متوسط
    return `${baseClass} border-amber-300 dark:border-amber-600 shadow-md hover:shadow-lg hover:scale-[1.01]`;
  }

  if (isIssued) {
    // صادر شده (منتظر پرداخت) → آبی با تاکید بالا
    return `${baseClass} border-blue-300 dark:border-blue-600 shadow-lg ring-2 ring-blue-200 dark:ring-blue-900/50 hover:shadow-xl hover:scale-[1.01]`;
  }

  // حالت پیش‌فرض
  return `${baseClass} border-gray-200 dark:border-gray-700 hover:shadow-md`;
}

export default function BillsPage() {
  const router = useRouter();
  const { error } = useToast();

  // State
  const [trackingCode, setTrackingCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const pageSize = 10;

  // Redux
  const bills = useSelector(selectBills);
  const pagination = useSelector(selectBillPaginationInfo);
  const isLoading = useSelector(selectBillIsLoading);

  const [getUserBills] = useLazyGetUserBillsQuery();

  // Fetch bills on mount and when filters change
  useEffect(() => {
    const fetchBills = async () => {
      try {
        await getUserBills({
          pageNumber: currentPage,
          pageSize,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy: 'issuedate',
            searchTerm:trackingCode,
          sortDirection: 'desc',
        });
      } catch (err) {
        console.error('Failed to fetch bills:', err);
      }
    };

    fetchBills();
  }, [currentPage, statusFilter, getUserBills, trackingCode]);



  const handleBillClick = (bill: Bill) => {
    console.log('🖱️ Bill clicked:', {
      billId: bill.id,
      referenceId: bill.referenceId,
      billType: bill.referenceType,
      hasReferenceId: !!bill.referenceId
    });

    // Use referenceId if available, otherwise use trackingCode
    const trackingCode = bill.referenceTrackingCode;

    if (!trackingCode) {
      console.error('❌ No tracking code or reference ID found for bill:', bill);
      error('خطا', 'کد پیگیری یافت نشد');
      return;
    }

    const billType = bill.referenceType || 'Bill';
    const url = `/bills/${encodeURIComponent(trackingCode)}?billType=${billType}`;
    console.log('🧭 Navigating to:', url);

    router.push(url);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    try {
      await getUserBills({
        pageNumber: currentPage,
        pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });
    } catch (err) {
      console.error('Failed to refresh bills:', err);
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
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="صورت حساب‌ها"
          titleIcon={<PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          showBackButton
          onBack={() => {
            // Check if came from dashboard
            if (document.referrer && document.referrer.includes('/dashboard')) {
              router.back();
            } else {
              router.push('/dashboard');
            }
          }}
          rightActions={[
            {
              icon: <PiArrowClockwise className="h-4 w-4" />,
              onClick: handleRefresh,
              label: 'تازه‌سازی',
              'aria-label': 'تازه‌سازی',
            },
          ]}
        />

        {/* Search Bar */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <InputField
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="جستجوی کد پیگیری یا شماره صورت حساب..."
              className="flex-1"
            />
            {trackingCode.trim() && (
              <Button
                onClick={() => setTrackingCode('')}
                variant="secondary"
                title="پاک کردن جستجو"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              همه
            </Button>
            <Button
              variant={statusFilter === 'Issued' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('Issued')}
            >
              صادر شده
            </Button>
            <Button
              variant={statusFilter === 'PartiallyPaid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('PartiallyPaid')}
            >
              پرداخت جزئی
            </Button>
            <Button
              variant={statusFilter === 'FullyPaid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('FullyPaid')}
            >
              پرداخت کامل
            </Button>
            <Button
              variant={statusFilter === 'Cancelled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('Cancelled')}
            >
              لغو شده
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <PiArrowClockwise className="h-6 w-6 animate-spin text-gray-400" />
                <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
              </div>
            ) : bills && bills.length > 0 ? (
              <>
                {/* Search results info */}
                {trackingCode.trim() && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">

                      {trackingCode.trim() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTrackingCode('')}
                          className="text-xs"
                        >
                          پاک کردن جستجو
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className={getBillCardClass(bill)}
                    onClick={() => {
                      console.log('🖱️ Div clicked:', bill.id);
                      handleBillClick(bill);
                    }}
                  >
                    {/* Amount and Status Row */}
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(bill.status || '')}
                        <div>
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {bill.billNumber || bill.referenceId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDateFa(bill.createdAt || bill.issueDate || null)}
                          </div>
                        </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(bill.status || '')}`}>
                          {getStatusLabel(bill.status || '')}
                        </span>
                      </div>

                    </div>

                    {/* Payment Info Row */}
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="border-l border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">کل مبلغ</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {formatCurrencyFa(bill.totalAmountRials || 0)} ریال
                          </div>
                        </div>
                        <div className="border-l border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">پرداخت شده</div>
                          <div className="font-semibold text-green-600 dark:text-green-400 text-sm">
                            {formatCurrencyFa(bill.paidAmountRials || 0)} ریال
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">مانده</div>
                          <div className="font-semibold text-amber-600 dark:text-amber-400 text-sm">
                            {formatCurrencyFa((bill.totalAmountRials || 0) - (bill.paidAmountRials || 0))} ریال
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Code Row */}
                    {bill.referenceTrackingCode && (
                      <div className="px-4 pb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-dashed border-emerald-200 dark:border-emerald-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">کد پیگیری:</div>
                              <div className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                {bill.referenceTrackingCode}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* Tracking Code Row */}
                      {bill.status === "Issued" && (
                          <div className="px-4 pb-3">
                              <Button className={"w-full"} onClick={()=>{
                                 router.push(`/bills/${bill.referenceTrackingCode}?billType=${bill.referenceType}`);
                              }}>
                                    پرداخت
                              </Button>
                          </div>
                      )}
                  </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <PiReceipt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {trackingCode.trim() ? 'نتیجه‌ای یافت نشد' : 'صورت حسابی یافت نشد'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {trackingCode.trim()
                    ? 'لطفاً کد پیگیری یا شماره صورت حساب دیگری را جستجو کنید'
                    : 'هیچ صورت حسابی با فیلترهای انتخابی پیدا نشد'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination - Hide when searching since search filters locally */}
        {pagination && pagination.totalPages > 1 && !trackingCode.trim() && (
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                قبلی
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
