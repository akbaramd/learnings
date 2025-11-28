'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetToursPaginatedQuery,
  type TourWithUserReservationDto,
} from '@/src/store/tours';
import { TourCard, TourCardSkeleton, type Tour } from '@/src/components/tours/TourCard';
import {
  PiArrowClockwise,
  PiMapPinDuotone,
} from 'react-icons/pi';
import { useToursPageHeader } from './ToursPageHeaderContext';
import { buildImageUrl } from '@/src/config/env';

// Equality guard for array comparison
function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function ToursPage() {
  const router = useRouter();
  const { setHeaderState } = useToursPageHeader();

  // State - Single source of truth: local state
  const [allTours, setAllTours] = useState<TourWithUserReservationDto[]>([]);
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
  const [getTours] = useLazyGetToursPaginatedQuery();

  // Derived values - computed in render, not in effects
  const currentPage = useMemo(() => {
    if (!pagination) return 1;
    return pagination.pageNumber;
  }, [pagination]);

  // Map tours to Tour type
  const mappedTours: Tour[] = useMemo(() => {
    return allTours.map((t) => ({
      id: t.id || '',
      title: t.title || 'بدون عنوان',
      description: t.title ?? '',
      photos: t.photos?.map((p) => (p.url ? buildImageUrl(p.url) : '')) ?? [],
      isRegistrationOpen: t.isRegistrationOpen ?? false,
      isFullyBooked: t.isFullyBooked ?? false,
      isNearlyFull: t.isNearlyFull ?? false,
      difficultyLevel: 1,
      price: t.pricing?.[0]?.effectivePriceRials ?? t.lowestPriceRials ?? 0,
      registrationStart: t.registrationStart ?? '',
      registrationEnd: t.registrationEnd ?? '',
      tourStart: t.tourStart ?? '',
      tourEnd: t.tourEnd ?? '',
      maxCapacity: t.maxCapacity ?? 0,
      remainingCapacity: t.remainingCapacity ?? 0,
      reservationId: t.reservation?.id ?? null,
      reservationStatus: t.reservation?.status ?? null,
      gender: t.gender ?? null,
      genderText: t.genderText ?? null,
    }));
  }, [allTours]);

  // Stable handlers
  const handleLoadMore = useCallback(() => {
    if (!pagination || isLoading) return;
    const hasMore = pagination.hasNextPage;
    if (hasMore) {
      setPagination(prev => prev ? {
        ...prev,
        pageNumber: prev.pageNumber + 1
      } : null);
    }
  }, [pagination, isLoading]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getTours({
        pageNumber: 1,
        pageSize,
        isActive: true, // Only show active tours
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

        setAllTours(prev => {
          if (shallowEqualArray(prev, items)) return prev;
          return items;
        });
      }
    } catch (err) {
      console.error('Failed to refresh tours:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getTours, pageSize, isLoading]);

  // Stable header handlers
  const onBack = useCallback(() => {
    if (document.referrer && document.referrer.includes('/dashboard')) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const onRefresh = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Set header state
  useEffect(() => {
    setHeaderState({
      title: 'تورها',
      titleIcon: <PiMapPinDuotone className="h-5 w-5 text-primary" />,
      showBackButton: true,
      onBack,
      rightActions: [
        {
          icon: <PiArrowClockwise className="h-4 w-4" />,
          onClick: onRefresh,
          label: 'تازه‌سازی',
          'aria-label': 'تازه‌سازی',
        },
      ],
    });
  }, [setHeaderState, onBack, onRefresh]);

  // Initial fetch
  useEffect(() => {
    const fetchFirstPage = async () => {
      try {
        setIsLoading(true);
        const result = await getTours({
          pageNumber: 1,
          pageSize,
          isActive: true,
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

          setAllTours(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch tours:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [getTours, pageSize]);

  // Load more when pagination changes
  useEffect(() => {
    if (!pagination || pagination.pageNumber === 1) return;

    const loadMoreTours = async () => {
      try {
        setIsLoading(true);
        const result = await getTours({
          pageNumber: pagination.pageNumber,
          pageSize,
          isActive: true,
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
            pageNumber: pageInfo.pageNumber || pagination.pageNumber,
            totalPages,
            hasNextPage: (pageInfo.pageNumber || pagination.pageNumber) < totalPages,
          });

          setAllTours(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newItems = items.filter(t => t.id && !existingIds.has(t.id));
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more tours:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreTours();
  }, [pagination?.pageNumber, getTours, pageSize]);

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
          setPagination(prev => prev ? {
            ...prev,
            pageNumber: prev.pageNumber + 1
          } : null);
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

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Scrollable Content */}
      <ScrollableArea className="flex-1" hideScrollbar={true}>
        <div className="pb-2">
          {isLoading && mappedTours.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <TourCardSkeleton key={i} />
              ))}
            </div>
          ) : mappedTours && mappedTours.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {mappedTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                  />
                ))}
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
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                      >
                        بارگذاری بیشتر
                      </button>
                    </div>
                  )}
                </div>
              )}

              {pagination && !pagination.hasNextPage && mappedTours.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-body text-muted">
                    تمام تورها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiMapPinDuotone className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                توری یافت نشد
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                در حال حاضر توری موجود نیست
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}
