'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import {
  useLazyGetReservationsPaginatedQuery,
} from '@/src/store/tours';
import { type TourReservationDto } from '@/src/services/Api';
import {
  PiCalendarCheck,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
} from 'react-icons/pi';
import { useToursPageHeader } from '../ToursPageHeaderContext';
import { formatDateFa, formatDateOnlyFa, formatCurrencyFa } from '@/src/lib/date-utils';





function getStatusInfo(status: string | null | undefined) {
  const statusMap: Record<string, {
    icon: React.ReactNode;
    label: string;
    badgeClass: string;
    iconBgClass: string;
  }> = {
    'Pending': {
      icon: <PiClock className="h-4 w-4 text-amber-500" />,
      label: 'در انتظار',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      iconBgClass: 'bg-amber-50 dark:bg-amber-900/20',
    },
    'Confirmed': {
      icon: <PiCheckCircle className="h-4 w-4 text-green-500" />,
      label: 'تایید شده',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      iconBgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    'Cancelled': {
      icon: <PiXCircle className="h-4 w-4 text-red-500" />,
      label: 'لغو شده',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconBgClass: 'bg-red-50 dark:bg-red-900/20',
    },
    'Completed': {
      icon: <PiCheckCircle className="h-4 w-4 text-blue-500" />,
      label: 'تکمیل شده',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
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

export default function ReservationsPage() {
  const router = useRouter();
  const { setHeaderState } = useToursPageHeader();

  // State - Single source of truth: local state
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allReservations, setAllReservations] = useState<TourReservationDto[]>([]);
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
  const [getReservations] = useLazyGetReservationsPaginatedQuery();

  // Derived values - computed in render, not in effects
  const normalizedSearch = useMemo(() => search.trim(), [search]);
  const normalizedStatus = useMemo(
    () => statusFilter !== 'all' ? statusFilter : undefined,
    [statusFilter]
  );

  // Stable handlers
  const handleReservationClick = useCallback((reservation: TourReservationDto) => {
    if (reservation.id) {
      router.push(`/tours/reservations/${reservation.id}`);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const result = await getReservations({
        pageNumber: currentPage,
        pageSize,
        status: normalizedStatus,
        search: normalizedSearch || undefined,
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
          setAllReservations(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      }
    } catch (err) {
      console.error('Failed to refresh reservations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getReservations, currentPage, pageSize, normalizedStatus, normalizedSearch, isLoading]);

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
      title: 'رزروهای تور',
      titleIcon: <PiCalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
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
        const result = await getReservations({
          pageNumber: 1,
          pageSize,
          status: normalizedStatus,
          search: normalizedSearch || undefined,
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

          setAllReservations(prev => {
            if (shallowEqualArray(prev, items)) return prev;
            return items;
          });
        }
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();
  }, [normalizedStatus, normalizedSearch, getReservations, pageSize]);

  // Load more when currentPage changes
  useEffect(() => {
    if (currentPage === 1) return;

    const loadMoreReservations = async () => {
      try {
        setIsLoading(true);
        const result = await getReservations({
          pageNumber: currentPage,
          pageSize,
          status: normalizedStatus,
          search: normalizedSearch || undefined,
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

          setAllReservations(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newItems = items.filter(r => r.id && !existingIds.has(r.id));
            if (newItems.length === 0) return prev;
            const merged = [...prev, ...newItems];
            if (merged.length === prev.length) return prev;
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to load more reservations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMoreReservations();
  }, [currentPage, getReservations, pageSize, normalizedStatus, normalizedSearch]);

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
                  placeholder="جستجوی رزرو..."
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
                  variant={statusFilter === 'all' ? 'solid' : 'outline'}
                  color={statusFilter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  همه
                </Button>
                <Button
                  variant={statusFilter === 'Pending' ? 'solid' : 'outline'}
                  color={statusFilter === 'Pending' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Pending')}
                >
                  در انتظار
                </Button>
                <Button
                  variant={statusFilter === 'Confirmed' ? 'solid' : 'outline'}
                  color={statusFilter === 'Confirmed' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Confirmed')}
                >
                  تایید شده
                </Button>
                <Button
                  variant={statusFilter === 'Completed' ? 'solid' : 'outline'}
                  color={statusFilter === 'Completed' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStatusFilter('Completed')}
                >
                  تکمیل شده
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
          {isLoading && allReservations.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-muted" />
              <span className="mr-2 text-muted">در حال بارگذاری...</span>
            </div>
          ) : allReservations && allReservations.length > 0 ? (
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

              <div className="space-y-3">
                {allReservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status);
                  const tourTitle = reservation.tourTitle || 'تور';
                  const reservationId = reservation.trackingCode || reservation.id?.substring(0, 8) || 'نامشخص';

                  return (
                    <Card
                      key={reservation.id}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover={true}
                      clickable={true}
                      onClick={() => handleReservationClick(reservation)}
                    >
                      {/* Header Row: Status Badge + Icon + Tour Title */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${statusInfo.iconBgClass} flex-shrink-0`}>
                            {statusInfo.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {tourTitle}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {reservationId}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusInfo.badgeClass} flex-shrink-0 ml-3`}>
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Information Row: Date + Participants + Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-6 text-sm">
                          {/* Tour Date */}
                          {reservation.tourStart && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 dark:text-gray-400 text-xs">📅</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDateOnlyFa(reservation.tourStart)}
                              </span>
                            </div>
                          )}

                          {/* Participants */}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">👥</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {reservation.participantCount || 0} نفر
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          {reservation.isFree
                            ? 'رایگان'
                            : formatCurrencyFa(reservation.totalAmountRials || 0)
                          }
                        </div>
                      </div>

                      {/* Bottom Row: Payment Status + Reservation Date */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        {/* Payment Status - only show for non-free */}
                        {!reservation.isFree && reservation.totalAmountRials && reservation.totalAmountRials > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">💳</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              reservation.isFullyPaid
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : reservation.isPaying
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                              {reservation.isFullyPaid ? 'پرداخت شده' : reservation.isPaying ? 'در حال پرداخت' : 'نپرداخته'}
                            </span>
                          </div>
                        )}

                        {/* Reservation Date */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span>📝</span>
                          <span>رزرو: {formatDateFa(reservation.reservationDate)}</span>
                        </div>
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

              {pagination && !pagination.hasNextPage && allReservations.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-body text-muted">
                    تمام رزروها نمایش داده شد
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiCalendarCheck className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-heading-2 text-on-surface mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'رزروی یافت نشد'}
              </h3>
              <p className="text-body text-muted mb-4">
                {normalizedSearch
                  ? 'لطفاً جستجوی دیگری را امتحان کنید'
                  : 'هیچ رزروی با فیلترهای انتخابی پیدا نشد'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}
