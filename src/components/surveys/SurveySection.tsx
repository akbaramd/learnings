'use client';

import React from 'react';
import Link from 'next/link';
import { PeekSlider } from '@/src/components/ui/Slider';
import { Survey, SurveyCard } from '@/src/components/surveys/SurveyCard';

type SurveySectionProps = {
  title: string;
  seeAllHref?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  surveys: Survey[];
  className?: string;
};

export function SurveySection({ title, seeAllHref, dir = 'auto', surveys, className }: SurveySectionProps) {
  return (
    <section className={['w-full', className || ''].join(' ')} dir={dir === 'auto' ? undefined : dir}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 transition"
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
        {surveys.map((s) => (
          <div key={s.id} className="p-0 h-full flex">
            <SurveyCard survey={s} className="w-full h-full" />
          </div>
        ))}
      </PeekSlider>
    </section>
  );
}

