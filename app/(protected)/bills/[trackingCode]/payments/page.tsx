'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetBillPaymentsQuery,
} from '@/src/store/payments';
import {
  PiCreditCard,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiArrowClockwise,
} from 'react-icons/pi';
import type { PaymentDto } from '@/src/services/Api';

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


// Equality guard for array comparison
function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

interface BillPaymentsPageProps {
  params: Promise<{ trackingCode: string }>;
}

export default function BillPaymentsPage({ params }: BillPaymentsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State - Single source of truth: local state
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [billId, setBillId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allPayments, setAllPayments] = useState<PaymentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    pageNumber: number;
    totalPages: number;
    hasNextPage: boolean;
  } | null>(null);
  const pageSize = 10;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Query hook - only for triggering fetches
  const [getBillPayments] = useLazyGetBillPaymentsQuery();

  // Load route params - external system (Next.js params)
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setTrackingCode(resolved.trackingCode);
    };
    resolveParams();
  }, [params]);

  // Get billId from URL search params - external system (URL)
  useEffect(() => {
    const billIdParam = searchParams.get('billId');
    if (billIdParam && billIdParam !== billId) {
      setBillId(billIdParam);
    }
  }, [searchParams, billId]);

  // Stable handlers
  const handlePaymentClick = useCallback((payment: PaymentDto) => {
    if (payment.paymentId) {
      router.push(`/bills/payments/${payment.paymentId}`);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    if (!billId || isLoading) return;
    try {
      setIsLoading(true);
      const result = await getBillPayments({
        billId,
        pageNumber: currentPage,
        pageSize,
        sortBy: 'issuedate', // Valid field: id, issuedate, duedate, amount, status
        sortDirection: 'desc',
      });
      
      if (result.data?.data) {
        const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil((pageInfo.totalCount || 0) / pageSizeFromApi))
            : 1;
        
        setPagination({
          pageNumber: pageInfo.pageNumber || currentPage,
          totalPages,
          hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
        });
        
        if (currentPage === 1) {
          setAllPayments(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getBillPayments, billId, currentPage, pageSize, isLoading]);

  // Fetch first page when billId is available
  useEffect(() => {
    if (!billId) return;

    // Single state update for reset
    setCurrentPage(1);
    
    const fetchFirstPage = async () => {
      try {
        setIsLoading(true);
        const result = await getBillPayments({
          billId,
          pageNumber: 1,
          pageSize,
          sortBy: 'issuedate', // Valid field: id, issuedate, duedate, amount, status
          sortDirection: 'desc',
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil((pageInfo.totalCount || 0) / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || 1,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || 1) < totalPages,
          });
          
          // Equality guard before setState
          setAllPayments(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [billId, getBillPayments, pageSize]);

  // Load more when currentPage changes
  useEffect(() => {
    if (currentPage === 1 || !billId) return;

    const loadMorePayments = async () => {
      try {
        setIsLoading(true);
        const result = await getBillPayments({
          billId,
          pageNumber: currentPage,
          pageSize,
          sortBy: 'issuedate', // Valid field: id, issuedate, duedate, amount, status
          sortDirection: 'desc',
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil((pageInfo.totalCount || 0) / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || currentPage,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
          });
          
          // Merge with existing items, avoiding duplicates
          setAllPayments(prev => {
            const existingIds = new Set(prev.map(p => p.paymentId).filter(Boolean));
            const newItems = items.filter(
              p => p.paymentId && !existingIds.has(p.paymentId)
            );
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            // Equality guard
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more payments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMorePayments();
  }, [currentPage, getBillPayments, billId, pageSize]);

  // Intersection Observer for infinite scroll - external system callback
  useEffect(() => {
    if (!loadMoreRef.current || !pagination) return;
    
    const hasMore = pagination.hasNextPage;
    if (!hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pagination, isLoading]);

  const handleBack = useCallback(() => {
    if (trackingCode) {
      router.push(`/bills/${trackingCode}`);
    } else {
      router.push('/bills');
    }
  }, [trackingCode, router]);

  const handleLoadMore = useCallback(() => {
    if (!pagination || isLoading) return;
    const hasMore = pagination.hasNextPage;
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination, isLoading]);

  if (!billId) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader
          title="پرداخت‌های صورت حساب"
          titleIcon={<PiCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          showBackButton
          onBack={handleBack}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <PiWarning className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
              شناسه فاکتور یافت نشد
            </h3>
            <Button onClick={handleBack} variant="solid" className="mt-4">
              بازگشت
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4" dir="rtl">
      {/* Header */}
      <PageHeader
        title="پرداخت‌های صورت حساب"
        titleIcon={<PiCreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
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

      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="pb-4">
          {isLoading && allPayments.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-gray-400" />
              <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
            </div>
          ) : allPayments && allPayments.length > 0 ? (
            <>
              <div className="space-y-2">
                {allPayments.map((payment) => {
                  const status = payment.status || '';
                  const isCancelled = status === 'Cancelled';
                  
                  return (
                    <Card
                      key={payment.paymentId}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover={!isCancelled}
                      clickable={!isCancelled}
                      onClick={() => handlePaymentClick(payment)}
                      className={isCancelled ? 'opacity-60 grayscale' : ''}
                    >
                    <div className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              پرداخت #{payment.paymentId?.substring(0, 8)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateFa(payment.createdAt || null)}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">مبلغ</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-md">
                            {formatCurrencyFa(payment.amountRials || 0)} ریال
                          </div>
                        </div>
                        <div className="text-right">
                          {payment.methodText && (
                            <>
                              <div className="text-xs text-gray-500 dark:text-gray-400">روش پرداخت</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {payment.methodText}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {payment.gatewayText && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            درگاه: {payment.gatewayText}
                          </div>
                        </div>
                      )}
                    </div>
                    </Card>
                  );
                })}
              </div>

              {/* Load More Trigger & Button */}
              {pagination && pagination.hasNextPage && (
                <div ref={loadMoreRef} className="mt-4 flex flex-col items-center gap-3">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <PiArrowClockwise className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">در حال بارگذاری...</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="min-w-[120px]"
                    >
                      بارگذاری بیشتر
                    </Button>
                  )}
                </div>
              )}

              {pagination && !pagination.hasNextPage && allPayments.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    تمام پرداخت‌ها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiCreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                پرداختی یافت نشد
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                برای این صورت حساب پرداختی ثبت نشده است
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

