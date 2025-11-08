'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  PiWarningCircle,
  PiListChecks,
  PiArrowCounterClockwise,
  PiBuilding,
  PiCalendarCheck,
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

function getStatusInfo(status: string | null | undefined) {
  const statusMap: Record<string, {
    icon: React.ReactNode;
    label: string;
    badgeClass: string;
    iconBgClass: string;
  }> = {
    'RequestSent': {
      icon: <PiFileText className="h-4 w-4 text-blue-500" />,
      label: 'ارسال شده',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
    },
    'PendingApproval': {
      icon: <PiClock className="h-4 w-4 text-amber-500" />,
      label: 'در انتظار تایید',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      iconBgClass: 'bg-amber-50 dark:bg-amber-900/20',
    },
    'PendingDocuments': {
      icon: <PiFileText className="h-4 w-4 text-orange-500" />,
      label: 'در انتظار مدارک',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      iconBgClass: 'bg-orange-50 dark:bg-orange-900/20',
    },
    'Waitlisted': {
      icon: <PiListChecks className="h-4 w-4 text-purple-500" />,
      label: 'در لیست انتظار',
      badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      iconBgClass: 'bg-purple-50 dark:bg-purple-900/20',
    },
    'ReturnedForAmendment': {
      icon: <PiArrowCounterClockwise className="h-4 w-4 text-yellow-500" />,
      label: 'بازگشت برای اصلاح',
      badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      iconBgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    'UnderReview': {
      icon: <PiClock className="h-4 w-4 text-indigo-500" />,
      label: 'در حال بررسی',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      iconBgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    'Approved': {
      icon: <PiCheckCircle className="h-4 w-4 text-green-500" />,
      label: 'تایید شده',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      iconBgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    'QueuedForDispatch': {
      icon: <PiCheckCircle className="h-4 w-4 text-teal-500" />,
      label: 'در صف ارسال به بانک',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
      iconBgClass: 'bg-teal-50 dark:bg-teal-900/20',
    },
    'SentToBank': {
      icon: <PiBuilding className="h-4 w-4 text-cyan-500" />,
      label: 'ارسال شده به بانک',
      badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
      iconBgClass: 'bg-cyan-50 dark:bg-cyan-900/20',
    },
    'BankScheduled': {
      icon: <PiCalendarCheck className="h-4 w-4 text-emerald-500" />,
      label: 'زمان‌بندی شده در بانک',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      iconBgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    'ProcessedByBank': {
      icon: <PiCheckCircle className="h-4 w-4 text-green-600" />,
      label: 'پردازش شده توسط بانک',
      badgeClass: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200',
      iconBgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    'Rejected': {
      icon: <PiXCircle className="h-4 w-4 text-red-500" />,
      label: 'رد شده',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconBgClass: 'bg-red-50 dark:bg-red-900/20',
    },
    'Cancelled': {
      icon: <PiXCircle className="h-4 w-4 text-gray-500" />,
      label: 'لغو شده',
      badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-500',
      iconBgClass: 'bg-gray-50 dark:bg-gray-900/20',
    },
    'Expired': {
      icon: <PiWarningCircle className="h-4 w-4 text-orange-500" />,
      label: 'منقضی شده',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      iconBgClass: 'bg-orange-50 dark:bg-orange-900/20',
    },
  };

  return statusMap[status || ''] || {
    icon: <PiWarning className="h-4 w-4 text-gray-500" />,
    label: status || 'نامشخص',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    iconBgClass: 'bg-gray-50 dark:bg-gray-900/20',
  };
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی درخواست..."
                  className="flex-1"
                />
                {normalizedSearch && (
                  <Button
                    onClick={() => setSearch('')}
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
                  variant={statusFilter === 'RequestSent' ? 'solid' : 'outline'}
                  color={statusFilter === 'RequestSent' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('RequestSent')}
                >
                  ارسال شده
                </Button>
                <Button
                  variant={statusFilter === 'PendingApproval' ? 'solid' : 'outline'}
                  color={statusFilter === 'PendingApproval' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('PendingApproval')}
                >
                  در انتظار تایید
                </Button>
                <Button
                  variant={statusFilter === 'PendingDocuments' ? 'solid' : 'outline'}
                  color={statusFilter === 'PendingDocuments' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('PendingDocuments')}
                >
                  در انتظار مدارک
                </Button>
                <Button
                  variant={statusFilter === 'UnderReview' ? 'solid' : 'outline'}
                  color={statusFilter === 'UnderReview' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('UnderReview')}
                >
                  در حال بررسی
                </Button>
                <Button
                  variant={statusFilter === 'Approved' ? 'solid' : 'outline'}
                  color={statusFilter === 'Approved' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Approved')}
                >
                  تایید شده
                </Button>
                <Button
                  variant={statusFilter === 'SentToBank' ? 'solid' : 'outline'}
                  color={statusFilter === 'SentToBank' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('SentToBank')}
                >
                  ارسال به بانک
                </Button>
                <Button
                  variant={statusFilter === 'Rejected' ? 'solid' : 'outline'}
                  color={statusFilter === 'Rejected' ? 'primary' : 'secondary'}
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
                      variant="subtle"
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
                  const statusInfo = getStatusInfo(request.status);
                  const facilityName = request.facility?.name || 'وام';
                  const cycleName = request.cycle?.name || 'نامشخص';
                  const requestId = request.id?.substring(0, 8) || 'نامشخص';
                  
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
                      {/* Top Row: Icon, Amount, Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${statusInfo.iconBgClass} flex-shrink-0`}>
                            {statusInfo.icon}
                          </div>
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrencyFa(request.requestedAmountRials || 0)} ریال
                          </div>
                        </div>
                        <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.badgeClass} flex-shrink-0`}>
                          {statusInfo.label}
                        </div>
                      </div>
                      
                      {/* Divider Line */}
                      <div className="border-t border-gray-200 dark:border-gray-700/50 my-2.5" />
                      
                      {/* Request Info - Always show */}
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed space-y-1">
                        <div>
                          <span className="opacity-80">شناسه درخواست:</span>{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300">{requestId}</span>
                        </div>
                        <div>
                          <span className="opacity-80">تسهیلات:</span>{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{facilityName}</span>
                        </div>
                        <div>
                          <span className="opacity-80">دوره:</span>{' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{cycleName}</span>
                        </div>
                      </div>
                      
                      {/* Bottom Row: Date (Left) and Approved Amount (Right) */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateFa(request.createdAt || null)}
                        </div>
                        {request.approvedAmountRials && (
                          <div className="text-xs text-green-600 dark:text-green-400 opacity-75">
                            مبلغ تایید شده: {formatCurrencyFa(request.approvedAmountRials)} ریال
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

