'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetFacilityRequestsQuery,
  type FacilityRequestDto,
} from '@/src/store/facilities';
import {
  PiFileText,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
} from 'react-icons/pi';
import { useFacilitiesPageHeader } from '../FacilitiesPageHeaderContext';

// Utility functions
function formatCurrencyFa(amount: number | null | undefined): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0';
  }
}

function formatDateFa(date: Date | string | null | undefined): string {
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
    case 'Approved':
      return <PiCheckCircle className="h-5 w-5 text-green-500" />;
    case 'Pending':
    case 'UnderReview':
      return <PiClock className="h-5 w-5 text-amber-500" />;
    case 'Rejected':
    case 'Cancelled':
      return <PiXCircle className="h-5 w-5 text-red-500" />;
    case 'Expired':
      return <PiWarning className="h-5 w-5 text-orange-500" />;
    default:
      return <PiWarning className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    'Pending': 'در انتظار',
    'UnderReview': 'در حال بررسی',
    'Approved': 'تایید شده',
    'Rejected': 'رد شده',
    'Cancelled': 'لغو شده',
    'Expired': 'منقضی شده'
  };
  return labels[status || ''] || status || 'نامشخص';
}

function getStatusBadgeClass(status: string | null | undefined) {
  const badgeMap: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'UnderReview': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    'Cancelled': 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
    'Expired': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
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

export default function RequestsPage() {
  const router = useRouter();
  const { setHeaderState } = useFacilitiesPageHeader();

  // State - Single source of truth: local state
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allRequests, setAllRequests] = useState<FacilityRequestDto[]>([]);
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
  const [getFacilityRequests] = useLazyGetFacilityRequestsQuery();

  // Derived values - computed in render, not in effects
  const normalizedSearch = useMemo(() => search.trim(), [search]);
  const normalizedStatus = useMemo(
    () => statusFilter !== 'all' ? statusFilter : undefined,
    [statusFilter]
  );

  // Stable handlers
  const handleRequestClick = useCallback((request: FacilityRequestDto) => {
    if (request.id) {
      router.push(`/facilities/requests/${request.id}`);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getFacilityRequests({
        pageNumber: currentPage,
        pageSize,
        status: normalizedStatus,
        searchTerm: normalizedSearch || undefined,
      });
      
      if (result.data?.data) {
        const items = result.data.data.items || [];
        const pageInfo = result.data.data;
        const pageSizeFromApi = pageInfo.pageSize || pageSize;
        const totalCount = pageInfo.totalCount || 0;
        const totalPages = pageSizeFromApi > 0 
          ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi))
          : 1;
        
        setPagination({
          pageNumber: pageInfo.pageNumber || currentPage,
          totalPages,
          hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
        });
        
        if (currentPage === 1) {
          setAllRequests(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getFacilityRequests, currentPage, pageSize, normalizedStatus, normalizedSearch, isLoading]);

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

  // Set header state
  useEffect(() => {
    setHeaderState({
      title: 'درخواست‌های تسهیلات',
      titleIcon: <PiFileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
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
    setCurrentPage(1);
    
    const fetchFirstPage = async () => {
      try {
        setIsLoading(true);
        const result = await getFacilityRequests({
          pageNumber: 1,
          pageSize,
          status: normalizedStatus,
          searchTerm: normalizedSearch || undefined,
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalCount = pageInfo.totalCount || 0;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || 1,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || 1) < totalPages,
          });
          
          setAllRequests(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [normalizedStatus, normalizedSearch, getFacilityRequests, pageSize]);

  // Load more when currentPage changes
  useEffect(() => {
    if (currentPage === 1) return;

    const loadMoreRequests = async () => {
      try {
        setIsLoading(true);
        const result = await getFacilityRequests({
          pageNumber: currentPage,
          pageSize,
          status: normalizedStatus,
          searchTerm: normalizedSearch || undefined,
        });
        
        if (result.data?.data) {
          const items = result.data.data.items || [];
          const pageInfo = result.data.data;
          const pageSizeFromApi = pageInfo.pageSize || pageSize;
          const totalCount = pageInfo.totalCount || 0;
          const totalPages = pageSizeFromApi > 0 
            ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi))
            : 1;
          
          setPagination({
            pageNumber: pageInfo.pageNumber || currentPage,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || currentPage) < totalPages,
          });
          
          setAllRequests(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newItems = items.filter(r => r.id && !existingIds.has(r.id));
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more requests:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreRequests();
  }, [currentPage, getFacilityRequests, pageSize, normalizedStatus, normalizedSearch]);

  // Intersection Observer for infinite scroll
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

  const handleLoadMore = useCallback(() => {
    if (!pagination || isLoading) return;
    const hasMore = pagination.hasNextPage;
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination, isLoading]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Search & Filters Card */}
      {showFilters && (
        <div className="flex-shrink-0 mb-4">
          <Card variant="default" radius="lg" padding="md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">جستجو و فیلتر</h3>
              <Button
                variant="ghost"
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی درخواست..."
                  className="flex-1"
                />
                {normalizedSearch && (
                  <Button
                    onClick={() => setSearch('')}
                    variant="secondary"
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
                  variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  همه
                </Button>
                <Button
                  variant={statusFilter === 'Pending' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Pending')}
                >
                  در انتظار
                </Button>
                <Button
                  variant={statusFilter === 'UnderReview' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('UnderReview')}
                >
                  در حال بررسی
                </Button>
                <Button
                  variant={statusFilter === 'Approved' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Approved')}
                >
                  تایید شده
                </Button>
                <Button
                  variant={statusFilter === 'Rejected' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Rejected')}
                >
                  رد شده
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="pb-2">
          {isLoading && allRequests.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-gray-400" />
              <span className="mr-2 text-gray-500">در حال بارگذاری...</span>
            </div>
          ) : allRequests && allRequests.length > 0 ? (
            <>
              {normalizedSearch && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch('')}
                      className="text-xs"
                    >
                      پاک کردن جستجو
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allRequests.map((request) => {
                  return (
                    <Card
                      key={request.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover={true}
                      clickable={true}
                      onClick={() => handleRequestClick(request)}
                    >
                      <div className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(request.status)}
                            <div>
                              <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                درخواست #{request.id?.substring(0, 8)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateFa(request.createdAt || null)}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {request.requestedAmountRials && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">مبلغ درخواستی</div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrencyFa(request.requestedAmountRials)} ریال
                              </div>
                            </div>
                          )}
                          {request.approvedAmountRials && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">مبلغ تایید شده</div>
                              <div className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrencyFa(request.approvedAmountRials)} ریال
                              </div>
                            </div>
                          )}
                        </div>
                        {request.facility?.name && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              تسهیلات: {request.facility?.name}
                            </div>
                          </div>
                        )}
                        {request.cycle?.name && (
                          <div className="mt-1">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              دوره: {request.cycle?.name}
                            </div>
                          </div>
                        )}
                      </div>

                      {request.facility?.description && (
                        <div className="px-4 pb-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {request.facility?.description}
                          </p>
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
                      variant="secondary"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="min-w-[120px]"
                    >
                      بارگذاری بیشتر
                    </Button>
                  )}
                </div>
              )}

              {pagination && !pagination.hasNextPage && allRequests.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    تمام درخواست‌ها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiFileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'درخواستی یافت نشد'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {normalizedSearch
                  ? 'لطفاً جستجوی دیگری را امتحان کنید'
                  : 'هیچ درخواستی با فیلترهای انتخابی پیدا نشد'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

