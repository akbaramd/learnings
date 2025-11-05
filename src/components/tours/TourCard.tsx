'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import { Card } from '../ui/Card';

/* ===================== Types ===================== */

export type Tour = {
  id: string;
  title: string;
  photos: string[];
  isRegistrationOpen: boolean;
  isFullyBooked?: boolean;        // Indicates if tour is completely full
  isNearlyFull?: boolean;         // Indicates if tour is nearly full (≥80% utilized)
  price?: number;                 // ریال
  registrationStart?: string;     // ISO
  registrationEnd?: string;       // ISO
  tourStart?: string;             // ISO
  tourEnd?: string;               // ISO
  maxCapacity?: number;
  remainingCapacity?: number;
  reservationId?: string | null;  // Reservation ID if user has reservation
  reservationStatus?: string | null; // Reservation status if user has reservation
};

type TourCardProps = {
  tour: Tour;
  className?: string;
  /** اگر true باشد حالت لودینگ اسکلتی رندر می‌شود */
  loading?: boolean;
  /** برای RTL/LTR بدون وابستگی به والد (اختیاری) */
  dir?: 'rtl' | 'ltr';
};

/* ===================== Utils (i18n/fa, formatting) ===================== */

const faDigits = (input: string | number) =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const priceFa = (price?: number) =>
  price != null ? `${faDigits(price.toLocaleString('fa-IR'))} ریال` : '—';

const formatDateRangeFa = (start?: string, end?: string) => {
  if (!start || !end) return 'نامشخص';
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'نامشخص';
  const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    month: 'short',
    day: 'numeric',
  });
  return `${fmt.format(s)} تا ${fmt.format(e)}`;
};

const durationFa = (start?: string, end?: string) => {
  if (!start || !end) return '—';
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e)) return '—';
  const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  return `${faDigits(days)} روزه`;
};

/* ===================== SafeImage ===================== */
/** از next/image برای مسیرهای داخلی استفاده می‌کند؛ برای URLهای ریموت نامطمئن روی <img> سوئیچ می‌کند تا خطای دامنه ندهد. */
function SafeImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  
  const isRemote = /^https?:\/\//i.test(src);
  if (!src) {
    return (
      <div className="w-full h-full grid place-items-center text-neutral-400">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M5 5h14v14H5z" />
        </svg>
      </div>
    );
  }
  if (isRemote) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width:768px) 90vw, (max-width:1024px) 45vw, 33vw"
      className={className ?? ''}
      priority={priority}
    />
  );
}

/* ===================== Skeleton ===================== */

export function TourCardSkeleton({ className, dir }: { className?: string; dir?: 'rtl'|'ltr' }) {
  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="none"
      className={['animate-pulse w-full overflow-hidden', className || ''].join(' ')}
    >
      <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-700" />
      <div className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    </Card>
  );
}

/* ===================== Reservation Status Helpers ===================== */

const getReservationStatusBadge = (status: string | null | undefined) => {
  switch (status) {
    case 'Confirmed':
      return {
        text: 'تأیید شده',
        className: 'bg-green-600',
      };
    case 'Pending':
      return {
        text: 'در انتظار',
        className: 'bg-yellow-500',
      };
    case 'Draft':
      return {
        text: 'پیش‌نویس',
        className: 'bg-blue-500',
      };
    case 'OnHold':
      return {
        text: 'در انتظار پرداخت',
        className: 'bg-orange-500',
      };
    case 'Expired':
      return {
        text: 'منقضی شده',
        className: 'bg-red-500',
      };
    default:
      return {
        text: 'رزرو شده',
        className: 'bg-gray-500',
      };
  }
};

/* ===================== TourCard ===================== */

export function TourCard({
  tour,
  className,
  loading,
  dir,
}: TourCardProps) {
  const router = useRouter();
  if (loading) {
    return <TourCardSkeleton className={className} dir={dir} />;
  }

  const cover = tour.photos?.[0] ?? '';

  const hasReservation = !!tour.reservationId;
  const reservationBadge = hasReservation && tour.reservationStatus 
    ? getReservationStatusBadge(tour.reservationStatus)
    : null;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasReservation && tour.reservationId) {
      // Navigate to reservation page if reservation exists
      router.push(`/tours/reservations/${tour.reservationId}`);
    } else {
      // Navigate to tour detail page if no reservation
      router.push(`/tours/${tour.id}`);
    }
  };

  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="none"
      hover={true}
      className={[
        'group w-full h-full flex flex-col text-right overflow-hidden',
        'hover:border-emerald-300/40 dark:hover:border-emerald-400/40',
        className || '',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-700">
        <SafeImage
          src={cover}
          alt={tour.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Gentle gradient overlay for visual polish (not for text) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

        {/* Registration Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <span
            className={[
              'px-2 py-1 text-xs font-medium rounded-full text-white shadow',
              tour.isRegistrationOpen ? 'bg-emerald-600' : 'bg-rose-500',
            ].join(' ')}
          >
            {tour.isRegistrationOpen ? 'ثبت‌نام باز' : 'ثبت‌نام بسته'}
          </span>
          {tour.isFullyBooked && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-white shadow">
              تکمیل شده
            </span>
          )}
          {tour.isNearlyFull && !tour.isFullyBooked && tour.isRegistrationOpen && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500 text-white shadow animate-pulse">
              ⚠️ کم‌ظرفیت
            </span>
          )}
        </div>

        {/* Reservation Status at bottom of image */}
        {hasReservation && reservationBadge && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${reservationBadge.className}`} />
              <span className="text-xs font-semibold text-white">
                وضعیت رزرو: {reservationBadge.text}
              </span>
            </div>
            <p className="text-xs text-white/90 mt-1">
              این تور قبلاً توسط شما رزرو شده است
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Title + Price */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
            {tour.title}
          </h3>
          <div className="shrink-0">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-medium">
              {priceFa(tour.price)}
            </span>
          </div>
        </div>

            
        {/* Meta list (compact & scannable) */}
        <div className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
          <div className="flex items-center gap-1.5">
            {/* calendar icon */}
            <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2h2V2zM3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"/>
            </svg>
            <span className="font-medium">ثبت‌نام:</span>
            <span className="text-neutral-600 dark:text-neutral-300">
              {formatDateRangeFa(tour.registrationStart, tour.registrationEnd)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* clock icon */}
            <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75Zm.75 5.5h-1.5v5.25l4.5 2.7.75-1.23-3.75-2.22Z"/>
            </svg>
            <span className="font-medium">زمان:</span>
            <span className="text-neutral-600 dark:text-neutral-300">
              {formatDateRangeFa(tour.tourStart, tour.tourEnd)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* duration icon */}
            <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/>
            </svg>
            <span className="font-medium">مدت:</span>
            <span className="text-neutral-600 dark:text-neutral-300">
              {durationFa(tour.tourStart, tour.tourEnd)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* users icon */}
              <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.67 0-8 1.34-8 4v2h12v-2c0-2.66-5.33-4-8-4Zm8 0c-.69 0-1.47.07-2.28.2A6 6 0 0 1 18 17v2h8v-2c0-2.66-5.33-4-8-4Z"/>
              </svg>
              <span className="font-medium">ظرفیت:</span>
              <span className="text-neutral-600 dark:text-neutral-300">
                {tour.maxCapacity ? `${faDigits(tour.maxCapacity)} نفر` : 'نامشخص'}
                {tour.remainingCapacity != null ? ` (${faDigits(tour.remainingCapacity)} باقی‌مانده)` : ''}
              </span>
            </div>

            {tour.isRegistrationOpen && tour.maxCapacity ? (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${tour.isFullyBooked ? 'bg-red-500' : tour.isNearlyFull ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className={`text-[11px] font-medium ${tour.isFullyBooked ? 'text-red-600 dark:text-red-400' : tour.isNearlyFull ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {tour.isFullyBooked
                    ? 'تکمیل شده'
                    : tour.isNearlyFull
                    ? 'کم‌ظرفیت'
                    : 'ظرفیت موجود'}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleButtonClick}
          variant={hasReservation ? 'primary' : 'ghost'}
          className={[
            'mt-4  w-full '
          ].join(' ')}
        >
          {hasReservation ? 'جزئیات رزرو' : 'جزئیات و ثبت نام'}
        </Button>
      </div>
    </Card>
  );
}

