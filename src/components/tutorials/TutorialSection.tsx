'use client';

import React from 'react';
import { TutorialCard, TutorialCardSkeleton, Tutorial } from './TutorialCard';

type TutorialSectionProps = {
  title: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  tutorials: Tutorial[];
  isLoading?: boolean;
  className?: string;
};

export function TutorialSection({ 
  title, 
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
      </div>

      {/* Tutorials Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <TutorialCardSkeleton key={idx} dir={dir} />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">در حال حاضر آموزشی موجود نیست</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              dir={dir}
            />
          ))}
        </div>
      )}
    </section>
  );
}

