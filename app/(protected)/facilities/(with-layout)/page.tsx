'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetFacilitiesQuery,
  type FacilityDto,
} from '@/src/store/facilities';
import {
  PiMoney,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
} from 'react-icons/pi';
import { useFacilitiesPageHeader } from './FacilitiesPageHeaderContext';

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

// Equality guard for array comparison
function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function FacilitiesPage() {
  const router = useRouter();
  const { setHeaderState } = useFacilitiesPageHeader();

  // State - Single source of truth: local state
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [onlyActiveFilter, setOnlyActiveFilter] = useState<boolean | undefined>(false);
  const [allFacilities, setAllFacilities] = useState<FacilityDto[]>([]);
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
  const [getFacilities] = useLazyGetFacilitiesQuery();

  // Derived values - computed in render, not in effects
  const normalizedSearch = useMemo(() => search.trim(), [search]);

  // Stable handlers
  const handleFacilityClick = useCallback((facility: FacilityDto) => {
    if (facility.id) {
      router.push(`/facilities/${facility.id}`);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getFacilities({
        pageNumber: currentPage,
        pageSize,
        searchTerm: normalizedSearch || undefined,
        isActive: onlyActiveFilter,
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
          setAllFacilities(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh facilities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getFacilities, currentPage, pageSize, normalizedSearch, onlyActiveFilter, isLoading]);

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
      title: 'تسهیلات',
      titleIcon: <PiMoney className="h-5 w-5 text-primary" />,
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
        const result = await getFacilities({
          pageNumber: 1,
          pageSize,
          searchTerm: normalizedSearch || undefined,
          isActive: onlyActiveFilter,
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
          
          setAllFacilities(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch facilities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [normalizedSearch, onlyActiveFilter, getFacilities, pageSize]);

  // Load more when currentPage changes
  useEffect(() => {
    if (currentPage === 1) return;

    const loadMoreFacilities = async () => {
      try {
        setIsLoading(true);
        const result = await getFacilities({
          pageNumber: currentPage,
          pageSize,
          searchTerm: normalizedSearch || undefined,
          isActive: onlyActiveFilter,
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
          
          setAllFacilities(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newItems = items.filter(f => f.id && !existingIds.has(f.id));
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more facilities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreFacilities();
  }, [currentPage, getFacilities, pageSize, normalizedSearch, onlyActiveFilter]);

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
              <h3 className="text-heading-3 text-on-surface">جستجو و فیلتر</h3>
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
              <label className="block text-label text-on-surface mb-2">
                جستجو
              </label>
              <div className="flex gap-2">
                <InputField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی نام یا کد تسهیلات..."
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
              <label className="block text-label text-on-surface mb-2">
                وضعیت
              </label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={onlyActiveFilter === undefined ? 'solid' : 'outline'}
                  color={onlyActiveFilter === undefined ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setOnlyActiveFilter(undefined)}
                >
                  همه
                </Button>
                <Button
                  variant={onlyActiveFilter === true ? 'solid' : 'outline'}
                  color={onlyActiveFilter === true ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setOnlyActiveFilter(true)}
                >
                  فعال
                </Button>
                <Button
                  variant={onlyActiveFilter === false ? 'solid' : 'outline'}
                  color={onlyActiveFilter === false ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setOnlyActiveFilter(false)}
                >
                  غیرفعال
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="pb-2">
          {isLoading && allFacilities.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-muted" />
              <span className="mr-2 text-muted">در حال بارگذاری...</span>
            </div>
          ) : allFacilities && allFacilities.length > 0 ? (
            <>
              {normalizedSearch && (
                <div className="mb-4 p-3 bg-accent-subtle rounded-lg border border-accent">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => setSearch('')}
                      className="text-caption"
                    >
                      پاک کردن جستجو
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allFacilities.map((facility) => {
                  const hasActiveCycles = facility.hasActiveCycles || false;
                  const isAcceptingApplications = facility.isAcceptingApplications || false;
                  
                  return (
                    <Card
                      key={facility.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover={true}
                      clickable={true}
                      onClick={() => handleFacilityClick(facility)}
                    >
                      <div className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <PiMoney className="h-5 w-5 text-primary" />
                            <div>
                              <div className="text-heading-3 text-on-surface">
                                {facility.name || facility.code || 'نامشخص'}
                              </div>
                              {facility.code && (
                                <div className="text-caption text-muted">
                                  کد: {facility.code}
                                </div>
                              )}
                            </div>
                          </div>
                          {hasActiveCycles && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              <PiCheckCircle className="h-3 w-3 inline ml-1" />
                              فعال
                            </span>
                          )}
                        </div>
                      </div>

                      {facility.description && (
                        <div className="px-4 pb-2">
                          <p className="text-body text-muted line-clamp-2">
                            {facility.description}
                          </p>
                        </div>
                      )}

                      {/* Cycle Statistics Info */}
                      {facility.cycleStatistics && (facility.cycleStatistics.totalActiveQuota !== undefined || facility.cycleStatistics.totalAvailableQuota !== undefined || facility.cycleStatistics.totalCyclesCount !== undefined) && (
                        <div className="px-4 border-t border-subtle pt-2 mt-2">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {facility.cycleStatistics.totalActiveQuota !== undefined && (
                              <div className="border-l border-subtle">
                                <div className="text-caption text-muted">ظرفیت فعال</div>
                                <div className="font-semibold text-primary text-body">
                                  {formatCurrencyFa(facility.cycleStatistics.totalActiveQuota)}
                                </div>
                              </div>
                            )}
                            {facility.cycleStatistics.totalAvailableQuota !== undefined && (
                              <div className="border-l border-subtle">
                                <div className="text-caption text-muted">ظرفیت موجود</div>
                                <div className="font-semibold text-accent text-body">
                                  {formatCurrencyFa(facility.cycleStatistics.totalAvailableQuota)}
                                </div>
                              </div>
                            )}
                            {facility.cycleStatistics.totalCyclesCount !== undefined && (
                              <div>
                                <div className="text-caption text-muted">کل دوره‌ها</div>
                                <div className="font-semibold text-amber-600 dark:text-amber-400 text-body">
                                  {formatCurrencyFa(facility.cycleStatistics.totalCyclesCount)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isAcceptingApplications && (
                        <div className="px-4 pb-3">
                          <Button
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (facility.id) {
                                router.push(`/facilities/${facility.id}`);
                              }
                            }}
                            variant="solid"
                          >
                            مشاهده جزئیات و درخواست
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
                      <PiArrowClockwise className="h-5 w-5 animate-spin text-muted" />
                      <span className="text-body text-muted">در حال بارگذاری...</span>
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

              {pagination && !pagination.hasNextPage && allFacilities.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-body text-muted">
                    تمام تسهیلات نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiMoney className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-heading-2 text-on-surface mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'تسهیلاتی یافت نشد'}
              </h3>
              <p className="text-body text-muted mb-4">
                {normalizedSearch
                  ? 'لطفاً نام یا کد تسهیلات دیگری را جستجو کنید'
                  : 'هیچ تسهیلاتی با فیلترهای انتخابی پیدا نشد'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}

