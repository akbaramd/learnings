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
  PiMagnifyingGlass,
  PiReceipt,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiArrowClockwise,
  PiArrowLeft,
  PiHouse,
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
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'completed':
      return <PiCheckCircle className="h-5 w-5 text-green-500" />;
    case 'unpaid':
    case 'pending':
      return <PiClock className="h-5 w-5 text-yellow-500" />;
    case 'cancelled':
      return <PiXCircle className="h-5 w-5 text-red-500" />;
    default:
      return <PiWarning className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusBadgeClass(status: string) {
  const badgeMap: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return badgeMap[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
          sortDirection: 'desc',
        });
      } catch (err) {
        console.error('Failed to fetch bills:', err);
      }
    };

    fetchBills();
  }, [currentPage, statusFilter, getUserBills]);

  const handleSearch = () => {
    if (!trackingCode.trim()) {
      error('لطفاً کد پیگیری را وارد کنید', 'کد پیگیری الزامی است');
      return;
    }

    // For search, use 'Bill' as default billType
    router.push(`/bills/${encodeURIComponent(trackingCode.trim())}?billType=Bill`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBillClick = (bill: Bill, e?: React.MouseEvent) => {
    console.log('🖱️ Bill clicked:', {
      billId: bill.id,
      referenceId: bill.referenceId,
      billType: bill.billType,
      hasReferenceId: !!bill.referenceId
    });
    
    // Use referenceId if available, otherwise use trackingCode
    const trackingCode = bill.referenceId;
    
    if (!trackingCode) {
      console.error('❌ No tracking code or reference ID found for bill:', bill);
      error('خطا', 'کد پیگیری یافت نشد');
      return;
    }

    const billType = bill.billType || 'Bill';
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
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
        <PageHeader
          title="صورت حساب‌ها"
          titleIcon={<PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          showBackButton
          onBack={() => router.push('/')}
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
              onKeyPress={handleKeyPress}
              placeholder="جستجوی کد پیگیری..."
              autoFocus
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={!trackingCode.trim()}
              variant="secondary"
            >
              <PiMagnifyingGlass className="h-4 w-4" />
            </Button>
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
              variant={statusFilter === 'unpaid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('unpaid')}
            >
              پرداخت نشده
            </Button>
            <Button
              variant={statusFilter === 'paid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('paid')}
            >
              پرداخت شده
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setStatusFilter('cancelled')}
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
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={(e) => {
                      console.log('🖱️ Div clicked:', bill.id);
                      handleBillClick(bill, e);
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
                          {bill.statusText || bill.status || 'نامشخص'}
                        </span>
                      </div>
                    
                    </div>
                    
                    {/* Payment Info Row */}
                    <div className="px-4 pb-2">
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
                    {bill.referenceId && (
                      <div className="px-4 pb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-dashed border-emerald-200 dark:border-emerald-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">کد پیگیری:</div>
                              <div className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                                {bill.referenceId}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <PiReceipt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  صورت حسابی یافت نشد
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  هیچ صورت حسابی با فیلترهای انتخابی پیدا نشد
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
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
