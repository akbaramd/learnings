// app/(protected)/hotels/(with-layout)/[accommodationId]/page.tsx
'use client';

import React, { useMemo, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { ScrollableArea } from '@/src/components/ui/ScrollableArea';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/hooks/useToast';
import {
  PiBuildingsDuotone,
  PiMapPinDuotone,
  PiUsers,
  PiDoor,
  PiCheckCircle,
  PiXCircle,
  PiWarning,
  PiSpinner,
  PiMoney,
  PiCalendar,
  PiArrowRight,
  PiClock,
  PiInfo,
  PiSparkle,
} from 'react-icons/pi';

import { buildImageUrl } from '@/src/config/env';
import { useGetAccommodationDetailQuery, useGetMyReservationsForAccommodationQuery } from '@/src/store/accommodations';

/* ===================== Utils ===================== */

const faDigits = (input: string | number) =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function formatCurrencyFa(amount?: number | null) {
  if (amount == null || Number.isNaN(amount)) return '—';
  if (amount === 0) return 'رایگان';
  try {
    return `${faDigits(new Intl.NumberFormat('fa-IR').format(amount))} ریال`;
  } catch {
    return `${faDigits(amount)} ریال`;
  }
}

function formatDateFa(date?: string | null) {
  if (!date) return 'نامشخص';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'نامشخص';
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  } catch {
    return 'نامشخص';
  }
}

function toAddressText(address: any): string | null {
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
}

/** <img> fallback for unknown remote domains */
function SafeImage({
  src,
  alt,
  priority,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const isRemote = /^https?:\/\//i.test(src);

  if (!src) {
    return (
      <div className="w-full h-full grid place-items-center text-neutral-400">
        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor" aria-hidden>
          <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2ZM5 7h14v6.2l-2.2-2.2a1 1 0 0 0-1.4 0l-2.1 2.1-3.1-3.1a1 1 0 0 0-1.4 0L5 13.9V7Zm0 10v-.3l4.6-4.6 3.1 3.1a1 1 0 0 0 1.4 0l2.1-2.1L19 16v1H5Z" />
        </svg>
        <span className="mt-2 text-xs">بدون تصویر</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} />;
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={['px-2 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap', className].join(' ')}>
      {children}
    </span>
  );
}

function clampText(s?: string | null, max = 220) {
  if (!s) return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

/* ===================== Page Props ===================== */

type Props = {
  params: Promise<{ accommodationId: string }>;
};

/* ===================== Page ===================== */

export default function AccommodationDetailsPage({ params }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const { accommodationId } = use(params);

  const { data: detailRes, isLoading, error, refetch } = useGetAccommodationDetailQuery(accommodationId, {
    skip: !accommodationId,
  });

  const { data: reservationsRes, isLoading: isLoadingReservations } = useGetMyReservationsForAccommodationQuery(
    { accommodationId, onlyActive: true },
    { skip: !accommodationId }
  );

  const acc = detailRes?.data;
  const reservations = reservationsRes?.data?.reservations || [];

  const addressText = useMemo(() => toAddressText(acc?.address), [acc?.address]);

  const photos = useMemo(() => {
    const list: string[] = [];

    const primary = acc?.primaryPhotoUrl ? buildImageUrl(acc.primaryPhotoUrl) : '';
    if (primary) list.push(primary);

    const fromPhotos = (acc?.photos || [])
      .map((p: any) => (typeof p === 'string' ? p : p?.url))
      .filter(Boolean)
      .map((u: string) => buildImageUrl(u));

    for (const u of fromPhotos) {
      if (u && !list.includes(u)) list.push(u);
    }

    return list;
  }, [acc?.photos, acc?.primaryPhotoUrl]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const activePhoto = photos[activePhotoIndex] || '';

  const handleBack = useCallback(() => {
    router.push('/hotels');
  }, [router]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="جزئیات اقامتگاه" showBackButton onBack={handleBack} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="flex justify-center items-center py-12">
            <PiSpinner className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="mr-2 text-xs text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  if (error || !acc) {
    return (
      <div className="h-full flex flex-col" dir="rtl">
        <PageHeader title="اقامتگاه یافت نشد" showBackButton onBack={handleBack} />
        <ScrollableArea className="flex-1" hideScrollbar>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">خطا در بارگذاری جزئیات اقامتگاه</p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={handleRetry} size="sm" variant="outline">
                  تلاش مجدد
                </Button>
                <Button onClick={handleBack} size="sm">
                  بازگشت
                </Button>
              </div>
            </div>
          </div>
        </ScrollableArea>
      </div>
    );
  }

  const isActive = !!acc.isActive;
  const hasRooms = Array.isArray(acc.rooms) && acc.rooms.length > 0;

  return (
    <div className="h-full flex flex-col" dir="rtl">
      <PageHeader
        title={acc.name || 'جزئیات اقامتگاه'}
        titleIcon={<PiBuildingsDuotone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        showBackButton
        onBack={handleBack}
      />

      <ScrollableArea className="flex-1" hideScrollbar>
        <div className="p-2 space-y-3 pb-20">
   

          {/* HERO */}
          <Card variant="default" radius="lg" padding="none" className="overflow-hidden">
            <div className="relative h-56 w-full bg-neutral-100 dark:bg-neutral-800">
              <SafeImage
                src={activePhoto}
                alt={acc.name || 'اقامتگاه'}
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

              <div className="absolute top-2 right-2 flex flex-wrap gap-1.5">
                <Badge className={isActive ? 'bg-emerald-600 text-white shadow' : 'bg-rose-600 text-white shadow'}>
                  {isActive ? 'فعال' : 'غیرفعال'}
                </Badge>
                {acc.typeText ? <Badge className="bg-gray-900/70 text-white shadow">{acc.typeText}</Badge> : null}
                {acc.hasAvailableRooms ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    اتاق موجود
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">بدون اتاق موجود</Badge>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h2 className="text-base font-semibold text-white line-clamp-1">{acc.name || '—'}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/90">
                  <PiMapPinDuotone className="h-4 w-4" />
                  <span className="line-clamp-1">{addressText || '—'}</span>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="p-3">
              {photos.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.slice(0, 12).map((u, idx) => {
                    const isSelected = idx === activePhotoIndex;
                    return (
                      <button
                        key={`${u}-${idx}`}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={[
                          'relative h-14 w-20 rounded-lg overflow-hidden border transition',
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-300/60'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300',
                        ].join(' ')}
                        aria-label={`تصویر ${idx + 1}`}
                        title={`تصویر ${idx + 1}`}
                      >
                        <SafeImage
                          src={u}
                          alt={`photo-${idx + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 p-3 text-xs text-neutral-600 dark:text-neutral-300">
                  تصویری برای این اقامتگاه ثبت نشده است.
                </div>
              )}
            </div>
          </Card>

          {/* Summary */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">خلاصه</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                <span className="inline-flex items-center gap-1">
                  <PiUsers className="h-3.5 w-3.5" />
                  ظرفیت: {acc.maxGuests != null ? faDigits(acc.maxGuests) : '—'}
                </span>
              </Badge>

              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                <span className="inline-flex items-center gap-1">
                  <PiDoor className="h-3.5 w-3.5" />
                  اتاق‌ها: {acc.totalRooms != null ? faDigits(acc.totalRooms) : '—'}
                </span>
              </Badge>

              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                <span className="inline-flex items-center gap-1">
                  <PiCheckCircle className="h-3.5 w-3.5" />
                  اتاق فعال: {acc.activeRooms != null ? faDigits(acc.activeRooms) : '—'}
                </span>
              </Badge>

              <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                <span className="inline-flex items-center gap-1">
                  <PiMoney className="h-3.5 w-3.5" />
                  از {formatCurrencyFa(acc.lowestPriceRials)}
                </span>
              </Badge>
            </div>

            {acc.description ? (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">توضیحات</div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {clampText(acc.description, 700)}
                </p>
              </div>
            ) : null}
          </Card>

          {/* Reservations List */}
          {!isLoadingReservations && (
            <Card variant="default" radius="lg" padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PiCalendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  رزروهای من برای این هتل
                </h3>
                {reservations.length > 0 && (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {faDigits(reservations.length)} رزرو
                  </div>
                )}
              </div>
              {reservations.length > 0 ? (
                <div className="space-y-2">
                  {reservations.slice(0, 5).map((reservation: any) => (
                    <div
                      key={reservation?.id}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 bg-white/60 dark:bg-neutral-900/30"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {reservation?.trackingCode || '—'}
                        </div>
                        <Badge className={reservation?.status === 'Paid' || reservation?.status === '4' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                          : reservation?.status === 'Paying' || reservation?.status === '3'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }>
                          {reservation?.status === 'Paid' || reservation?.status === '4' ? 'پرداخت شده' :
                           reservation?.status === 'Paying' || reservation?.status === '3' ? 'در حال پرداخت' :
                           reservation?.status === 'Confirmed' || reservation?.status === '2' ? 'تأیید شده' :
                           reservation?.status === 'Submitted' || reservation?.status === '1' ? 'ارسال شده' :
                           reservation?.status === 'Pending' || reservation?.status === '0' ? 'در حال ویرایش' :
                           reservation?.status || '—'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                        {reservation?.checkInDate && formatDateFa(reservation.checkInDate)} - {reservation?.checkOutDate && formatDateFa(reservation.checkOutDate)}
                      </div>
                      {reservation?.room?.number && (
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          اتاق: {reservation.room.number}
                        </div>
                      )}
                    </div>
                  ))}
                  {reservations.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/hotels/reservations')}
                    >
                      مشاهده همه رزروها ({faDigits(reservations.length)})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <PiCalendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">هیچ رزروی برای این هتل یافت نشد</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    می‌توانید با کلیک روی دکمه "شروع رزرو" یک رزرو جدید ایجاد کنید
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Rooms */}
          <Card variant="default" radius="lg" padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <PiDoor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                اتاق‌ها
              </h3>

              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {acc.totalRooms != null ? faDigits(acc.totalRooms) : faDigits(acc.rooms?.length ?? 0)} اتاق
              </div>
            </div>

            {hasRooms ? (
              <div className="space-y-2">
                {acc.rooms!.map((r: any) => {
                  const isRoomActive = !!r?.isActive;
                  return (
                    <div
                      key={r?.id || r?.number || Math.random().toString(16)}
                      className={[
                        'rounded-lg border px-3 py-2.5 flex items-start justify-between gap-3',
                        'border-neutral-200/70 dark:border-neutral-700/60',
                        isRoomActive
                          ? 'bg-white/60 dark:bg-neutral-900/30'
                          : 'bg-neutral-100 dark:bg-neutral-900/10 opacity-80',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {r?.number || '—'}
                        </div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                          {r?.roomTypeText || r?.roomType || 'اتاق'}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                          <span className="inline-flex items-center gap-1">
                            <PiUsers className="h-3.5 w-3.5 text-neutral-500" />
                            ظرفیت: {r?.capacity != null ? faDigits(r.capacity) : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isRoomActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <PiCheckCircle className="h-4 w-4" />
                            فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            <PiXCircle className="h-4 w-4" />
                            غیرفعال
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 p-3 text-xs text-neutral-600 dark:text-neutral-300">
                اتاقی برای این اقامتگاه ثبت نشده است.
              </div>
            )}
          </Card>

          {/* Rules / cancellable */}
          <Card variant="default" radius="lg" padding="md">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">قوانین</h3>

            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <PiClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  قابلیت کنسلی
                </span>
                <span className="font-semibold">{acc.isCancellable ? 'دارد' : 'ندارد'}</span>
              </div>

              {acc.isCancellable && acc.cancellableUntilHoursBeforeCheckIn != null ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <PiWarning className="h-4 w-4 text-amber-500" />
                    مهلت کنسلی
                  </span>
                  <span className="font-semibold">{faDigits(acc.cancellableUntilHoursBeforeCheckIn)} ساعت قبل از ورود</span>
                </div>
              ) : null}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400">
                ایجاد: {formatDateFa(acc.createdAt)}{' '}
                {acc.lastModifiedAt ? `• آخرین تغییر: ${formatDateFa(acc.lastModifiedAt)}` : ''}
              </div>
            </div>
          </Card>

          {/* Recent prices (optional) */}
          {Array.isArray(acc.recentPrices) && acc.recentPrices.length > 0 && (
            <Card variant="default" radius="lg" padding="md">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-3">قیمت‌های اخیر</h3>

              <div className="space-y-2">
                {acc.recentPrices.slice(0, 14).map((p: any) => (
                  <div
                    key={p?.date || `${p?.day}-${Math.random().toString(16)}`}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2"
                  >
                    <div className="text-xs text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-2">
                      <PiCalendar className="h-4 w-4 text-neutral-500" />
                      {formatDateFa(p?.date)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {formatCurrencyFa(p?.priceRials ?? p?.effectivePriceRials ?? null)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ScrollableArea>

      {/* Sticky CTA (optional) */}
      <div className="sticky bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/hotels/reservations')}
            leftIcon={<PiArrowRight className="h-4 w-4" />}
          >
            رزروهای هتل
          </Button>

          <Button
            className="flex-1"
            onClick={() => router.push(`/hotels/${accommodationId}/reserve`)}
            leftIcon={<PiCheckCircle className="h-4 w-4" />}
          >
            شروع رزرو
          </Button>
        </div>
      </div>
    </div>
  );
}
