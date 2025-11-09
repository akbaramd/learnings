'use client';

import React from 'react';
import Link from 'next/link';
import { PeekSlider } from '@/src/components/ui/Slider';
import { Facility, FacilityCard } from '@/src/components/facilities/FacilityCard';

type FacilitySectionProps = {
  title: string;
  seeAllHref?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  facilities: Facility[];
  className?: string;
};

export function FacilitySection({ title, seeAllHref, dir = 'auto', facilities, className }: FacilitySectionProps) {
  return (
    <section className={['w-full', className || ''].join(' ')} dir={dir === 'auto' ? undefined : dir}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 transition"
          >
            مشاهده همه
          </Link>
        )}
      </div>

      {/* Slider */}
      <PeekSlider
        dir={dir}
        loop={false}
        disableDrag={false}
        itemClassName="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 h-full"
        peekPaddingClass="pe-4"
        showDots
      >
        {facilities.map((f) => (
          <div key={f.id} className="p-0 h-full flex">
            <FacilityCard facility={f} className="w-full h-full" />
          </div>
        ))}
      </PeekSlider>
    </section>
  );
}

