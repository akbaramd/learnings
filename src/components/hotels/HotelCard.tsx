// src/components/hotels/HotelCard.tsx
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';

/* ===================== Types (match your API) ===================== */

export type AccommodationApiItem = {
  id: string;
  name?: string | null;
  type?: string | null;
  typeText?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  address?: {
    street?: string | null;
    postalCode?: string | null;
    cityId?: string | null;
    provinceId?: string | null;
    coordinates?: { latitude?: number | null; longitude?: number | null } | null;
    cityName?: string | null;
    provinceName?: string | null;
    fullAddress?: string | null;
  } | null;
  maxGuests?: number | null;
  totalCapacity?: number | null;
  totalRooms?: number | null;
  activeRooms?: number | null;
  rooms?: Array<{
    id: string;
    number?: string | null;
    roomType?: string | null;
    roomTypeText?: string | null;
    capacity?: number | null;
    isActive?: boolean | null;
  }> | null;
  photos?: Array<{ url?: string | null } | string> | null;
  primaryPhotoUrl?: string | null;
  lowestPriceRials?: number | null;
};

export type Accommodation = {
  id: string;
  name: string;
  typeText?: string | null;
  description?: string | null;
  isActive: boolean;
  addressText: string | null;
  maxGuests?: number | null;
  totalRooms?: number | null;
  activeRooms?: number | null;
  rooms: Array<{
    id: string;
    number: string | null;
    roomTypeText: string | null;
    capacity: number | null;
    isActive: boolean;
  }>;
  photos: string[]; // already normalized urls
  primaryPhotoUrl?: string | null;
  lowestPriceRials?: number | null;
};

type Props = {
  accommodation: Accommodation;
  className?: string;
  loading?: boolean;
  dir?: 'rtl' | 'ltr';
};

/* ===================== Utils ===================== */

const faDigits = (input: string | number) =>
  String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const priceFa = (price?: number | null) => {
  if (price == null) return '—';
  if (price === 0) return 'رایگان';
  return `${faDigits(price.toLocaleString('fa-IR'))} ریال`;
};

const clampText = (s?: string | null, max = 140) => {
  if (!s) return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
};

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
        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="currentColor" aria-hidden>
          <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2ZM5 7h14v6.2l-2.2-2.2a1 1 0 0 0-1.4 0l-2.1 2.1-3.1-3.1a1 1 0 0 0-1.4 0L5 13.9V7Zm0 10v-.3l4.6-4.6 3.1 3.1a1 1 0 0 0 1.4 0l2.1-2.1L19 16v1H5Z" />
        </svg>
        <span className="mt-2 text-xs">بدون تصویر</span>
      </div>
    );
  }

  if (isRemote) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading={priority ? 'eager' : 'lazy'} />;
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

export function AccommodationCardSkeleton({ className, dir }: { className?: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="none"
      className={['animate-pulse w-full overflow-hidden', className || ''].join(' ')}
    >
      <div className="relative h-52 w-full bg-neutral-100 dark:bg-neutral-700" />
      <div className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-44 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>
        <div className="h-9 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    </Card>
  );
}

/* ===================== Small UI pieces ===================== */

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={['px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap', className].join(' ')}>
      {children}
    </span>
  );
}

function RoomPill({
  number,
  roomTypeText,
  capacity,
  isActive,
}: {
  number: string | null;
  roomTypeText: string | null;
  capacity: number | null;
  isActive: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2',
        'border-neutral-200/70 dark:border-neutral-700/60',
        isActive ? 'bg-white/60 dark:bg-neutral-900/30' : 'bg-neutral-100 dark:bg-neutral-900/10 opacity-75',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {number || '—'}
        </div>
        <div className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
          {roomTypeText || 'اتاق'}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-neutral-700 dark:text-neutral-300">
          ظرفیت: {capacity != null ? faDigits(capacity) : '—'}
        </span>
        <span
          className={[
            'w-2 h-2 rounded-full',
            isActive ? 'bg-emerald-500' : 'bg-neutral-400',
          ].join(' ')}
          aria-hidden
        />
      </div>
    </div>
  );
}

/* ===================== Card ===================== */

export function AccommodationCard({ accommodation, className, loading, dir }: Props) {
  const router = useRouter();
  if (loading) return <AccommodationCardSkeleton className={className} dir={dir} />;

  const cover = useMemo(() => {
    // Prefer primary, then first photo
    return accommodation.primaryPhotoUrl || accommodation.photos?.[0] || '';
  }, [accommodation.primaryPhotoUrl, accommodation.photos]);

  const rooms = accommodation.rooms || [];
  const activeRoomsCount = accommodation.activeRooms ?? rooms.filter((r) => r.isActive).length;

  const handleOpen = () => router.push(`/hotels/${accommodation.id}`);

  return (
    <Card
      dir={dir}
      variant="default"
      radius="lg"
      padding="none"
      hover
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleOpen();
      }}
      className={[
        'group w-full h-full flex flex-col text-right overflow-hidden cursor-pointer',
        'hover:border-emerald-300/40 dark:hover:border-emerald-400/40',
        className || '',
      ].join(' ')}
    >
      {/* Cover */}
      <div className="relative h-52 w-full bg-neutral-100 dark:bg-neutral-800">
        <SafeImage
          src={cover}
          alt={accommodation.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          priority={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 right-2 flex flex-row gap-1.5 flex-wrap">
          {accommodation.isActive ? (
            <Badge className="bg-emerald-600 text-white shadow">فعال</Badge>
          ) : (
            <Badge className="bg-rose-600 text-white shadow">غیرفعال</Badge>
          )}
          {accommodation.typeText ? (
            <Badge className="bg-gray-900/70 text-white shadow">{accommodation.typeText}</Badge>
          ) : null}
        </div>

        {/* Bottom info strip */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{accommodation.name || 'بدون عنوان'}</h3>
              <p className="text-xs text-white/85 line-clamp-1">
                {accommodation.addressText || '—'}
              </p>
            </div>

            <div className="shrink-0">
              <span className="px-2 py-1 rounded bg-white/15 backdrop-blur text-white text-xs font-semibold">
                {priceFa(accommodation.lowestPriceRials)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Description (short) */}
        {accommodation.description ? (
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-6 mb-3">
            {clampText(accommodation.description, 160)}
          </p>
        ) : null}

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2 mb-3">

          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
            اتاق‌ها: {accommodation.totalRooms != null ? faDigits(accommodation.totalRooms) : faDigits(rooms.length)}
          </Badge>

          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
            اتاق فعال: {activeRoomsCount != null ? faDigits(activeRoomsCount) : '—'}
          </Badge>
        </div>

        {/* {rooms.length > 0 ? (
          <div className="mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                اتاق‌ها
              </span>
              {rooms.length > 3 ? (
                <span className="text-[11px] text-neutral-500">
                  +{faDigits(rooms.length - 3)} مورد دیگر
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              {rooms.slice(0, 3).map((r) => (
                <RoomPill
                  key={r.id}
                  number={r.number}
                  roomTypeText={r.roomTypeText}
                  capacity={r.capacity}
                  isActive={r.isActive}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-1 rounded-lg border border-dashed border-neutral-200/70 dark:border-neutral-700/60 p-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              اطلاعات اتاق‌ها ثبت نشده است.
            </p>
          </div>
        )} */}

        {/* Action */}
        <Button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleOpen();
          }}
          variant="outline"
          color="secondary"
          className="mt-4 w-full"
        >
          مشاهده جزئیات
        </Button>
      </div>
    </Card>
  );
}
