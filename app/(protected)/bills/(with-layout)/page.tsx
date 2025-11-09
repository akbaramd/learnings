'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { useToast } from '@/src/hooks/useToast';
import {
  useLazyGetUserBillsQuery,
  type Bill,
} from '@/src/store/bills';
import {
  PiReceipt,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
} from 'react-icons/pi';
import { useBillsPageHeader } from './BillsPageHeaderContext';

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


// Equality guard for array comparison
function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function BillsPage() {
  const router = useRouter();
  const { error } = useToast();
  const { setHeaderState } = useBillsPageHeader();

  // State - Single source of truth: local state
  const [trackingCode, setTrackingCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [showFilters, setShowFilters] = useState(false);
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
  const [getUserBills] = useLazyGetUserBillsQuery();

  // Derived values - computed in render, not in effects
  const normalizedSearch = useMemo(() => trackingCode.trim(), [trackingCode]);
  const normalizedStatus = useMemo(
    () => statusFilter !== 'all' ? statusFilter : undefined,
    [statusFilter]
  );

  // Stable handlers
  const handleBillClick = useCallback((bill: Bill) => {
    const billTrackingCode = bill.referenceTrackingCode;

    if (!billTrackingCode) {
      error('خطا', 'کد پیگیری یافت نشد');
      return;
    }

    const billType = bill.referenceType || 'Bill';
    const url = `/bills/${encodeURIComponent(billTrackingCode)}?billType=${billType}`;
    router.push(url);
  }, [router, error]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getUserBills({
        pageNumber: currentPage,
        pageSize,
        status: normalizedStatus,
        sortBy: 'issuedate',
        searchTerm: normalizedSearch || undefined,
        sortDirection: 'desc',
      });
      
      if (result.data?.data) {
        const items = result.data.data.items || [];
        const pageInfo = result.data.data;
        const pageSizeFromApi = pageInfo.pageSize || pageSize;
        const totalPages = pageSizeFromApi > 0 
          ? Math.max(1, Math.ceil((pageInfo.totalItems || 0) / pageSizeFromApi))
          : 1;
        
        setPagination({
          pageNumber: pageInfo.pageNumber || currentPage,
          totalPages,
          hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
        });
        
        if (currentPage === 1) {
          setAllBills(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh bills:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getUserBills, currentPage, pageSize, normalizedStatus, normalizedSearch, isLoading]);

  // Stable header handlers
  const onBack = useCallback(() => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const onToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Set header state - stable handlers, only update when handlers change
  useEffect(() => {
    setHeaderState({
      title: 'صورت حساب‌ها',
      titleIcon: <PiReceipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      showBackButton: true,
      onBack,
      rightActions: [
        {
          icon: <PiFunnelSimple className="h-4 w-4" />,
          onClick: onToggleFilters,
          label: 'فیلتر',
          'aria-label': 'فیلتر',
        },
        {
          icon: <PiArrowClockwise className="h-4 w-4" />,
          onClick: handleRefresh,
          label: 'تازه‌سازی',
          'aria-label': 'تازه‌سازی',
        },
      ],
    });
  }, [setHeaderState, onBack, onToggleFilters, handleRefresh]);

  // Reset and fetch first page when filters/search change
  useEffect(() => {
    // Single state update for reset
    setCurrentPage(1);
    
    const fetchFirstPage = async () => {
      try {
        setIsLoading(true);
        const result = await getUserBills({
          pageNumber: 1,
          pageSize,
          status: normalizedStatus,
          sortBy: 'issuedate',
          searchTerm: normalizedSearch || undefined,
          sortDirection: 'desc',
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil((pageInfo.totalItems || 0) / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || 1,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || 1) < totalPages,
          });
          
          // Equality guard before setState
          setAllBills(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch bills:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [normalizedStatus, normalizedSearch, getUserBills, pageSize]);

  // Load more when currentPage changes (for infinite scroll)
  useEffect(() => {
    if (currentPage === 1) return; // Skip if it's the first page (handled above)

    const loadMoreBills = async () => {
      try {
        setIsLoading(true);
        const result = await getUserBills({
          pageNumber: currentPage,
          pageSize,
          status: normalizedStatus,
          sortBy: 'issuedate',
          searchTerm: normalizedSearch || undefined,
          sortDirection: 'desc',
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil((pageInfo.totalItems || 0) / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || currentPage,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
          });
          
          // Merge with existing items, avoiding duplicates
          setAllBills(prev => {
            const existingIds = new Set(prev.map(b => b.id));
            const newItems = items.filter(b => !existingIds.has(b.id));
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            // Equality guard
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more bills:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreBills();
  }, [currentPage, getUserBills, pageSize, normalizedStatus, normalizedSearch]);

  // Intersection Observer for infinite scroll - external system callback
  useEffect(() => {
    if (!loadMoreRef.current || !pagination) return;
    
    const hasMore = pagination.hasNextPage;
    if (!hasMore) return;

    // Cleanup previous observer
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

  const handleLoadMore = useCallback(() => {
    if (!pagination || isLoading) return;
    const hasMore = pagination.hasNextPage;
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination, isLoading]);

  return (
    <div className="ps-2 h-full flex flex-col" dir="rtl">
        {/* Search & Filters Card */}
        {showFilters && (
          <div className="flex-shrink-0 mb-4">
            <Card variant="default" radius="lg" padding="md">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">جستجو و فیلتر</h3>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="p-1"
                  aria-label="بستن فیلتر"
                >
                  <PiX className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  جستجو
                </label>
                <div className="flex gap-2">
                  <InputField
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="جستجوی کد پیگیری یا شماره صورت حساب..."
                    className="flex-1"
                  />
                  {normalizedSearch && (
                    <Button
                      onClick={() => setTrackingCode('')}
                      variant="outline"
                      title="پاک کردن جستجو"
                      size="sm"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === 'all' ? 'solid' : 'outline'}
                    color={statusFilter === 'all' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    همه
                  </Button>
                  <Button
                    variant={statusFilter === 'Issued' ? 'solid' : 'outline'}
                    color={statusFilter === 'Issued' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('Issued')}
                  >
                    صادر شده
                  </Button>
                  <Button
                    variant={statusFilter === 'PartiallyPaid' ? 'solid' : 'outline'}
                    color={statusFilter === 'PartiallyPaid' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('PartiallyPaid')}
                  >
                    پرداخت جزئی
                  </Button>
                  <Button
                    variant={statusFilter === 'FullyPaid' ? 'solid' : 'outline'}
                    color={statusFilter === 'FullyPaid' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('FullyPaid')}
                  >
                    پرداخت کامل
                  </Button>
                  <Button
                    variant={statusFilter === 'Cancelled' ? 'solid' : 'outline'}
                    color={statusFilter === 'Cancelled' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter('Cancelled')}
                  >
                    لغو شده
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Scrollable Content */}
        <ScrollableArea className="flex-1" hideScrollbar={true}>
          <div className="pb-2">
            {isLoading && allBills.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <PiArrowClockwise className="h-6 w-6 animate-spin text-gray-400" />
                <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
              </div>
            ) : allBills && allBills.length > 0 ? (
              <>
                {normalizedSearch && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => setTrackingCode('')}
                        className="text-xs"
                      >
                        پاک کردن جستجو
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {allBills.map((bill) => {
                    const status = bill.status || '';
                    const isCancelled = status === 'Cancelled' || status === 'Refunded';
                    
                    return (
                      <Card
                        key={bill.id}
                        variant="default"
                        radius="lg"
                        padding="md"
                        hover={!isCancelled}
                        clickable={!isCancelled}
                        onClick={() => handleBillClick(bill)}
                        className={isCancelled ? 'opacity-60 grayscale' : ''}
                      >
                      <div className="pb-2">
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

                      {bill.status === "Issued" && (
                        <div className="px-4 pb-3">
                          <Button
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/bills/${bill.referenceTrackingCode}?billType=${bill.referenceType}`);
                            }}
                            variant='solid'
                            color='primary'
                          >
                            پرداخت
                          </Button>
                        </div>
                      )}
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

                {pagination && !pagination.hasNextPage && allBills.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      تمام صورت حساب‌ها نمایش داده شد
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <PiReceipt className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'صورت حسابی یافت نشد'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {normalizedSearch
                    ? 'لطفاً کد پیگیری یا شماره صورت حساب دیگری را جستجو کنید'
                    : 'هیچ صورت حسابی با فیلترهای انتخابی پیدا نشد'
                  }
                </p>
              </div>
            )}
          </div>
        </ScrollableArea>
      </div>
  );
}

