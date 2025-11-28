'use client';

import React from 'react';
import Link from 'next/link';
import { PeekSlider } from '@/src/components/ui/Slider';
import { TutorialCard, TutorialCardSkeleton, Tutorial } from './TutorialCard';

type TutorialSectionProps = {
  title: string;
  seeAllHref?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  tutorials: Tutorial[];
  isLoading?: boolean;
  className?: string;
};

export function TutorialSection({
  title,
  seeAllHref,
  dir = 'rtl',
  tutorials,
  isLoading = false,
  className
}: TutorialSectionProps) {
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
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex-shrink-0 w-[90vw] max-w-[320px]">
              <TutorialCardSkeleton dir={dir} />
            </div>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">در حال حاضر آموزشی موجود نیست</p>
        </div>
      ) : (
        <PeekSlider
          dir={dir}
          loop={false}
          disableDrag={false}
          itemClassName="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 h-full"
          peekPaddingClass="pe-4"
          showDots
        >
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="p-0 h-full flex">
              <TutorialCard
                tutorial={tutorial}
                dir={dir}
                className="w-full h-full"
              />
            </div>
          ))}
        </PeekSlider>
      )}
    </section>
  );
}

