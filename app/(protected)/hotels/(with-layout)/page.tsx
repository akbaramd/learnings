// app/(protected)/hotels/(with-layout)/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { useLazyGetAccommodationsPaginatedQuery } from '@/src/store/accommodations';
import {
  AccommodationCard,
  AccommodationCardSkeleton,
  type Accommodation,
} from '@/src/components/hotels/HotelCard';
import { useHotelsPageHeader } from './HotelsPageHeaderContext';
import { buildImageUrl } from '@/src/config/env';
import { PiArrowClockwise, PiBuildingsDuotone } from 'react-icons/pi';

type Pagination = {
  pageNumber: number;
  totalPages: number;
  hasNextPage: boolean;
};

const pageSize = 10;
const toAddressText = (address: any): string | null => {
  if (!address) return null;
  if (typeof address === 'string') return address.trim() || null;

  if (typeof address === 'object') {
    const full = typeof address.fullAddress === 'string' ? address.fullAddress.trim() : '';
    if (full) return full;

    const parts = [
      typeof address.provinceName === 'string' ? address.provinceName.trim() : '',
      typeof address.cityName === 'string' ? address.cityName.trim() : '',
      typeof address.street === 'string' ? address.street.trim() : '',
      typeof address.postalCode === 'string' && address.postalCode.trim()
        ? `کدپستی: ${address.postalCode.trim()}`
        : '',
    ].filter(Boolean);

    return parts.length ? parts.join('، ') : null;
  }

  return null;
};
/** Safe "string or {name}" -> string */
const toName = (v: unknown): string | null => {
  if (!v) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'object' && v && 'name' in (v as any) && typeof (v as any).name === 'string') {
    const n = (v as any).name.trim();
    return n || null;
  }
  return null;
};

/** Address can be string or object. Always return string (or null) to avoid React rendering object errors. */
const toAddressString = (address: unknown): string | null => {
  if (!address) return null;

  if (typeof address === 'string') return address.trim() || null;

  if (typeof address === 'object') {
    const a = address as any;

    const full = typeof a.fullAddress === 'string' ? a.fullAddress.trim() : '';
    if (full) return full;

    const parts = [
      typeof a.provinceName === 'string' ? a.provinceName.trim() : '',
      typeof a.cityName === 'string' ? a.cityName.trim() : '',
      typeof a.street === 'string' ? a.street.trim() : '',
      typeof a.postalCode === 'string' && a.postalCode.trim() ? `کدپستی: ${a.postalCode.trim()}` : '',
    ].filter(Boolean);

    return parts.length ? parts.join('، ') : null;
  }

  return null;
};

export default function HotelsPage() {
  const router = useRouter();
  const { setHeaderState } = useHotelsPageHeader();

  const [allItems, setAllItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // NOTE: we don't rely only on RTK's isLoading; we keep a local guard to prevent double fetch.
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Prevent duplicate calls / race conditions
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef<string>('');
  const initialFetchedRef = useRef(false);

  const [getAccommodations] = useLazyGetAccommodationsPaginatedQuery();

  const mappedItems: Accommodation[] = useMemo(() => {
    return (allItems || []).map((a) => {
      const photoUrls = (a.photos || [])
      .map((p: any) => {
        const url = typeof p === 'string' ? p : p?.url;
        return url ? buildImageUrl(url) : '';
      })
      .filter(Boolean);

    const primary = a.primaryPhotoUrl ? buildImageUrl(a.primaryPhotoUrl) : null;

      return {
        id: a.id || '',
        name: a.name || 'بدون عنوان',
        typeText: a.typeText ?? null,
        description: a.description ?? null,
        isActive: !!a.isActive,
        addressText: toAddressText(a.address),
        maxGuests: a.maxGuests ?? null,
        totalRooms: a.totalRooms ?? null,
        activeRooms: a.activeRooms ?? null,
        rooms: (a.rooms || []).map((r: any) => ({
          id: r.id,
          number: r.number ?? null,
          roomTypeText: r.roomTypeText ?? null,
          capacity: r.capacity ?? null,
          isActive: !!r.isActive,
        })),
        photos: photoUrls,
        primaryPhotoUrl: primary,
        lowestPriceRials: a.lowestPriceRials ?? null,
      };
    });
  }, [allItems]);

  const applyPagePayload = useCallback(
    (payload: any, mode: 'replace' | 'append') => {
      const items = payload?.items || [];

      const pageSizeFromApi = payload?.pageSize ?? pageSize;
      const totalCount = payload?.totalCount ?? 0;
      const totalPages =
        pageSizeFromApi > 0 ? Math.max(1, Math.ceil(totalCount / pageSizeFromApi)) : 1;

      const currentPageNumber = payload?.pageNumber ?? 1;

      setPagination({
        pageNumber: currentPageNumber,
        totalPages,
        hasNextPage: currentPageNumber < totalPages,
      });

      if (mode === 'replace') {
        setAllItems(items);
      } else {
        setAllItems((prev) => {
          const existingIds = new Set(prev.map((x: any) => x.id || x.accommodationId));
          const newItems = items.filter((x: any) => {
            const id = x.id || x.accommodationId;
            return id && !existingIds.has(id);
          });
          return newItems.length ? [...prev, ...newItems] : prev;
        });
      }
    },
    []
  );

  const fetchPage = useCallback(
    async (pageNumber: number, mode: 'replace' | 'append') => {
      // Hard guards against circular fetch + observer spam
      if (inFlightRef.current) return;

      const key = `${mode}:${pageNumber}:${pageSize}`;
      if (lastKeyRef.current === key) return;
      lastKeyRef.current = key;

      inFlightRef.current = true;
      setIsLoading(true);

      try {
        const result = await getAccommodations(
          { pageNumber, pageSize, isActive: true },
          true // prefer newest result
        );

        const payload = result.data?.data;
        if (payload) {
          applyPagePayload(payload, mode);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch accommodations:', err);
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [applyPagePayload, getAccommodations]
  );

  const handleRefresh = useCallback(() => {
    // allow refresh even if last key matches
    lastKeyRef.current = '';
    fetchPage(1, 'replace');
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!pagination?.hasNextPage) return;
    fetchPage(pagination.pageNumber + 1, 'append');
  }, [fetchPage, pagination]);

  const onBack = useCallback(() => {
    if (document.referrer && document.referrer.includes('/dashboard')) router.back();
    else router.push('/dashboard');
  }, [router]);

  // Header (stable)
  useEffect(() => {
    setHeaderState({
      title: 'هتل‌ها',
      titleIcon: <PiBuildingsDuotone className="h-5 w-5 text-primary" />,
      showBackButton: true,
      onBack,
      rightActions: [
        {
          icon: <PiArrowClockwise className="h-4 w-4" />,
          onClick: handleRefresh,
          label: 'تازه‌سازی',
          'aria-label': 'تازه‌سازی',
        },
      ],
    });
  }, [handleRefresh, onBack, setHeaderState]);

  // Initial fetch (STRICT guard so it never loops)
  useEffect(() => {
    if (initialFetchedRef.current) return;
    initialFetchedRef.current = true;
    fetchPage(1, 'replace');
  }, [fetchPage]);

  // Infinite scroll observer (no state write here, only calls fetchPage)
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

        fetchPage(pagination.pageNumber + 1, 'append');
      },
      { threshold: 0.1, rootMargin: '140px' }
    );

    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [fetchPage, pagination?.hasNextPage, pagination?.pageNumber]);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <ScrollableArea className="flex-1" hideScrollbar>
        <div className="pb-2">
          {isLoading && mappedItems.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <AccommodationCardSkeleton key={i} />
              ))}
            </div>
          ) : mappedItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {mappedItems.map((acc) => (
                  <AccommodationCard key={acc.id} accommodation={acc} />
                ))}
              </div>

              {pagination?.hasNextPage ? (
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
                        disabled={isLoading || inFlightRef.current}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        type="button"
                      >
                        بارگذاری بیشتر
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-body text-muted">تمام هتل‌ها نمایش داده شد</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <PiBuildingsDuotone className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                هتلی یافت نشد
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">در حال حاضر هتلی موجود نیست</p>
              <div className="mt-4">
                <button
                  onClick={handleRefresh}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  type="button"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollableArea>
    </div>
  );
}
