// app/(protected)/hotels/(with-layout)/reservations/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputField } from '@/src/components/forms/InputField';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { useLazyGetReservationsPaginatedQuery } from '@/src/store/accommodations';
import {
  PiCalendarCheck,
  PiArrowClockwise,
  PiFunnelSimple,
  PiX,
  PiCheckCircle,
  PiClock,
  PiXCircle,
  PiWarning,
  PiHouse,
} from 'react-icons/pi';
import { useHotelsPageHeader } from '../HotelsPageHeaderContext';
import { formatDateFa, formatDateOnlyFa, formatCurrencyFa } from '@/src/lib/date-utils';

/* ===================== Helpers ===================== */

function getStatusInfo(status: string | null | undefined) {
  const map: Record<
    string,
    { icon: React.ReactNode; label: string; badgeClass: string; iconBgClass: string }
  > = {
    Pending: {
      icon: <PiClock className="h-4 w-4 text-amber-500" />,
      label: 'در انتظار',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      iconBgClass: 'bg-amber-50 dark:bg-amber-900/20',
    },
    Confirmed: {
      icon: <PiCheckCircle className="h-4 w-4 text-green-500" />,
      label: 'تأیید شده',
      badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      iconBgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    Cancelled: {
      icon: <PiXCircle className="h-4 w-4 text-red-500" />,
      label: 'لغو شده',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      iconBgClass: 'bg-red-50 dark:bg-red-900/20',
    },
    Completed: {
      icon: <PiCheckCircle className="h-4 w-4 text-blue-500" />,
      label: 'تکمیل شده',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      iconBgClass: 'bg-blue-50 dark:bg-blue-900/20',
    },
    Draft: {
      icon: <PiClock className="h-4 w-4 text-sky-500" />,
      label: 'پیش‌نویس',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
      iconBgClass: 'bg-sky-50 dark:bg-sky-900/20',
    },
    OnHold: {
      icon: <PiWarning className="h-4 w-4 text-orange-500" />,
      label: 'در انتظار پرداخت',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      iconBgClass: 'bg-orange-50 dark:bg-orange-900/20',
    },
    Expired: {
      icon: <PiXCircle className="h-4 w-4 text-rose-500" />,
      label: 'منقضی شده',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      iconBgClass: 'bg-rose-50 dark:bg-rose-900/20',
    },
  };

  return map[status || ''] || {
    icon: <PiWarning className="h-4 w-4 text-gray-500" />,
    label: status || 'نامشخص',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    iconBgClass: 'bg-gray-50 dark:bg-gray-900/20',
  };
}

const normalize = (s: string) => s.trim();

/** Prevent duplicate in-flight calls + observer spam */
function useFetchGuards() {
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef<string>('');
  return { inFlightRef, lastKeyRef };
}

/* ===================== Types (minimal + safe) ===================== */
/**
 * Your API DTO name might differ (GetReservationsPaginatedResponse items).
 * This type is intentionally permissive but uses only fields we render.
 */
type HotelReservation = {
  id?: string | null;
  trackingCode?: string | null;

  status?: string | null;

  accommodationId?: string | null;
  accommodationName?: string | null;

  roomId?: string | null;
  roomNumber?: string | null;

  guestCount?: number | null;

  checkInDate?: string | null;
  checkOutDate?: string | null;

  reservationDate?: string | null;

  totalAmountRials?: number | null;
  isFree?: boolean | null;

  isFullyPaid?: boolean | null;
  isPaying?: boolean | null;
};

/* ===================== Page ===================== */

export default function HotelReservationsPage() {
  const router = useRouter();
  const { setHeaderState } = useHotelsPageHeader();

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // data state
  const [items, setItems] = useState<HotelReservation[]>([]);
  const [pagination, setPagination] = useState<{
    pageNumber: number;
    totalPages: number;
    hasNextPage: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // guards
  const initialFetchedRef = useRef(false);
  const { inFlightRef, lastKeyRef } = useFetchGuards();

  // query hook
  const [getReservations] = useLazyGetReservationsPaginatedQuery();
  const pageSize = 10;

  // derived filters
  const normalizedSearch = useMemo(() => normalize(search), [search]);
  const normalizedStatus = useMemo(
    () => (statusFilter !== 'all' ? statusFilter : undefined),
    [statusFilter]
  );

  const goToReservationDetail = useCallback(
    (r: HotelReservation) => {
      if (!r?.id) return;
      router.push(`/hotels/reservations/${r.id}`);
    },
    [router]
  );

  const applyPayload = useCallback((payload: any, mode: 'replace' | 'append') => {
    const newItems: HotelReservation[] = payload?.items || [];

    const pageSizeFromApi = payload?.pageSize ?? pageSize;
    const totalCount = payload?.totalCount ?? 0;
    const totalPages =
      pageSizeFromApi > 0 ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi)) : 1;

    const pageNumber = payload?.pageNumber ?? 1;

    setPagination({
      pageNumber,
      totalPages,
      hasNextPage: pageNumber < totalPages,
    });

    if (mode === 'replace') {
      setItems(newItems);
      return;
    }

    setItems((prev) => {
      const existingIds = new Set(prev.map((x) => x.id).filter(Boolean) as string[]);
      const filtered = newItems.filter((x) => x.id && !existingIds.has(x.id));
      return filtered.length ? [...prev, ...filtered] : prev;
    });
  }, []);

  const fetchPage = useCallback(
    async (pageNumber: number, mode: 'replace' | 'append') => {
      if (inFlightRef.current) return;

      const key = `${mode}:${pageNumber}:${pageSize}:${normalizedStatus ?? ''}:${normalizedSearch ?? ''}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      inFlightRef.current = true;
      setIsLoading(true);

      try {
        const res = await getReservations(
          {
            pageNumber,
            pageSize,
            status: normalizedStatus,
            searchTerm: normalizedSearch || undefined, // NOTE: your DTO uses searchTerm (accommodations api)
          } as any,
          true
        );

        const payload = res.data?.data;
        if (payload) applyPayload(payload, mode);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch hotel reservations:', e);
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [applyPayload, getReservations, inFlightRef, lastKeyRef, normalizedSearch, normalizedStatus, pageSize]
  );

  const handleRefresh = useCallback(() => {
    lastKeyRef.current = '';
    fetchPage(1, 'replace');
  }, [fetchPage, lastKeyRef]);

  const handleLoadMore = useCallback(() => {
    if (!pagination?.hasNextPage) return;
    fetchPage((pagination?.pageNumber ?? 1) + 1, 'append');
  }, [fetchPage, pagination]);

  const onBack = useCallback(() => {
    if (document.referrer && document.referrer.includes('/dashboard')) router.back();
    else router.push('/dashboard');
  }, [router]);

  const onToggleFilters = useCallback(() => setShowFilters((p) => !p), []);

  // header
  useEffect(() => {
    setHeaderState({
      title: 'رزروهای هتل',
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
  }, [handleRefresh, onBack, onToggleFilters, setHeaderState]);

  // initial fetch (no loops)
  useEffect(() => {
    if (initialFetchedRef.current) return;
    initialFetchedRef.current = true;
    fetchPage(1, 'replace');
  }, [fetchPage]);

  // refetch when filters/search change (single effect, safe guards)
  useEffect(() => {
    // allow refetch even if last key matches previous first page
    lastKeyRef.current = '';
    fetchPage(1, 'replace');
  }, [normalizedSearch, normalizedStatus, fetchPage, lastKeyRef]);

  // infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (inFlightRef.current) return;
        if (!pagination?.hasNextPage) return;

        fetchPage((pagination.pageNumber ?? 1) + 1, 'append');
      },
      { threshold: 0.1, rootMargin: '120px' }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [fetchPage, inFlightRef, pagination?.hasNextPage, pagination?.pageNumber]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {showFilters && (
        <div className="flex-shrink-0 mb-4">
          <Card variant="default" radius="lg" padding="md">
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

            <div className="mb-4">
              <label className="block text-label text-on-surface mb-2">جستجو</label>
              <div className="flex gap-2">
                <InputField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی رزرو..."
                  className="flex-1"
                />
                {normalizedSearch && (
                  <Button onClick={() => setSearch('')} variant="outline" title="پاک کردن جستجو" size="sm">
                    ✕
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-label text-on-surface mb-2">وضعیت</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'همه' },
                  { key: 'Pending', label: 'در انتظار' },
                  { key: 'Confirmed', label: 'تأیید شده' },
                  { key: 'Completed', label: 'تکمیل شده' },
                  { key: 'Cancelled', label: 'لغو شده' },
                  { key: 'OnHold', label: 'در انتظار پرداخت' },
                  { key: 'Expired', label: 'منقضی شده' },
                  { key: 'Draft', label: 'پیش‌نویس' },
                ].map((s) => (
                  <Button
                    key={s.key}
                    variant={statusFilter === s.key ? 'solid' : 'outline'}
                    color={statusFilter === s.key ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setStatusFilter(s.key)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      <ScrollableArea className="flex-1" hideScrollbar>
        <div className="pb-2">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <PiArrowClockwise className="h-6 w-6 animate-spin text-muted" />
              <span className="mr-2 text-muted">در حال بارگذاری...</span>
            </div>
          ) : items.length > 0 ? (
            <>
              {normalizedSearch && (
                <div className="mb-4 p-3 bg-accent-subtle rounded-lg border border-accent">
                  <div className="flex items-center justify-between">
                    <Button variant="subtle" size="sm" onClick={() => setSearch('')} className="text-caption">
                      پاک کردن جستجو
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {items.map((r) => {
                  const statusInfo = getStatusInfo(r.status);
                  const title = r.accommodationName || 'رزرو اقامتگاه';
                  const code = r.trackingCode || r.id?.slice(0, 8) || 'نامشخص';

                  const checkIn = r.checkInDate ? formatDateOnlyFa(r.checkInDate) : '—';
                  const checkOut = r.checkOutDate ? formatDateOnlyFa(r.checkOutDate) : '—';
                  const guestCount = r.guestCount ?? 0;

                  const priceText =
                    r.isFree || !r.totalAmountRials ? 'رایگان' : formatCurrencyFa(r.totalAmountRials);

                  const showPayment =
                    !r.isFree && (r.totalAmountRials ?? 0) > 0;

                  return (
                    <Card
                      key={r.id || code}
                      variant="default"
                      radius="lg"
                      padding="md"
                      hover
                      clickable
                      onClick={() => goToReservationDetail(r)}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${statusInfo.iconBgClass} flex-shrink-0`}>
                            {statusInfo.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {code}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusInfo.badgeClass} flex-shrink-0 ml-3`}
                        >
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Main info row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">🏨</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {r.roomNumber ? `اتاق ${r.roomNumber}` : 'اتاق —'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">👥</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {guestCount} نفر
                            </span>
                          </div>
                        </div>

                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          {priceText}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <span>📅</span>
                          <span className="font-medium">ورود:</span>
                          <span>{checkIn}</span>
                          <span className="mx-1">—</span>
                          <span className="font-medium">خروج:</span>
                          <span>{checkOut}</span>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <span>📝</span>
                          <span>رزرو: {r.reservationDate ? formatDateFa(r.reservationDate) : '—'}</span>
                        </div>
                      </div>

                      {/* Payment status */}
                      {showPayment ? (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">💳</span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              r.isFullyPaid
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : r.isPaying
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}
                          >
                            {r.isFullyPaid ? 'پرداخت شده' : r.isPaying ? 'در حال پرداخت' : 'نپرداخته'}
                          </span>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>

              {/* Load more */}
              {pagination?.hasNextPage ? (
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
                      disabled={isLoading || inFlightRef.current}
                      className="min-w-[120px]"
                    >
                      بارگذاری بیشتر
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-body text-muted">تمام رزروها نمایش داده شد</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiHouse className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-heading-2 text-on-surface mb-2">
                {normalizedSearch ? 'نتیجه‌ای یافت نشد' : 'رزروی یافت نشد'}
              </h3>
              <p className="text-body text-muted mb-4">
                {normalizedSearch ? 'لطفاً جستجوی دیگری را امتحان کنید' : 'هیچ رزروی پیدا نشد'}
              </p>
              <Button variant="outline" onClick={handleRefresh}>
                تازه‌سازی
              </Button>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}
