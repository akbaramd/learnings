'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';

type PeekSliderProps = {
  children: React.ReactNode;
  className?: string;
  /** 'ltr' | 'rtl' | 'auto' (default: auto reads documentElement.dir on client) */
  dir?: 'ltr' | 'rtl' | 'auto';
  loop?: boolean;
  /** Disable dragging/swiping (dots still work) */
  disableDrag?: boolean;
  /** Tailwind padding on the trailing edge to hint the next slide (e.g. 'pe-4' or 'pr-4') */
  peekPaddingClass?: string; // default: 'pe-4' (works with dir)
  /** Card container classes for each slide’s content wrapper */
  itemClassName?: string; // e.g. 'rounded-xl border bg-white dark:bg-neutral-800'
  /** Show tiny dot indicators */
  showDots?: boolean; // default: true
  /** Callback when the selected slide changes */
  onIndexChange?: (index: number) => void;
};

function resolveDir(dir: 'ltr' | 'rtl' | 'auto'): 'ltr' | 'rtl' {
  if (dir !== 'auto') return dir;
  if (typeof document !== 'undefined') {
    const d = (document.documentElement.getAttribute('dir') || 'ltr').toLowerCase();
    return d === 'rtl' ? 'rtl' : 'ltr';
  }
  return 'ltr';
}

export function PeekSlider({
  children,
  className,
  dir = 'auto',
  loop = false,
  disableDrag = true,
  peekPaddingClass = 'pe-4',
  itemClassName = 'rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800',
  showDots = true,
  onIndexChange,
}: PeekSliderProps) {
  const resolvedDir = resolveDir(dir);

  const emblaOptions: EmblaOptionsType = useMemo(
    () => ({
      direction: resolvedDir,
      loop,
      align: 'start',
      dragFree: false,
      containScroll: 'trimSnaps',
      // Some versions don’t expose this in typings; safe to ignore if TS complains.
      draggable: !disableDrag,
      skipSnaps: false,
    }),
    [resolvedDir, loop, disableDrag]
  );

  const [viewportRef, embla] = useEmblaCarousel(emblaOptions);
  const emblaApi = embla as unknown as EmblaCarouselType | null;

  const slides = React.Children.toArray(children);
  const [selected, setSelected] = useState(0);

  // Keep onIndexChange stable without changing refs during render
  const onIndexChangeRef = useRef(onIndexChange);
  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const i = emblaApi.selectedScrollSnap();
    setSelected(i);
    onIndexChangeRef.current?.(i);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Defer initial setState to next frame to avoid “setState in effect” warning
    const raf = requestAnimationFrame(() => {
      const i = emblaApi.selectedScrollSnap();
      setSelected(i);
      onIndexChangeRef.current?.(i);
    });

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      cancelAnimationFrame(raf);
    };
  }, [emblaApi, onSelect]);

  return (
    <section
      dir={resolvedDir}
      className={['w-full select-none', className || ''].join(' ')}
      aria-roledescription="carousel"
      aria-label="Slider"
    >
      <div className="overflow-hidden" ref={viewportRef}>
        <div className="flex">
          {slides.map((child, i) => (
            <div
              key={i}
              className={['shrink-0 basis-[90%]', peekPaddingClass].join(' ')} // 90% width + tiny peek
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${slides.length}`}
            >
              <div className={itemClassName}>
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDots && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={[
                'rounded-full transition-all',
                // Tiny dots: inactive 6x6, active 18x6 “pill”
                i === selected
                  ? 'h-1.5 w-4.5 bg-neutral-900 dark:bg-neutral-100'
                  : 'h-1.5 w-1.5 bg-neutral-300 dark:bg-neutral-600',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* Optional: item wrapper for consistency */
export function PeekSliderItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/* ---------------- Demo (kept) ---------------- */
const Card = ({ title, text }: { title: string; text: string }) => (
  <div className="h-56 w-full p-5">
    <h4 className="text-sm font-semibold mb-1 text-neutral-900 dark:text-neutral-100">{title}</h4>
    <p className="text-xs text-neutral-700 dark:text-neutral-300">{text}</p>
  </div>
);

export default function Example() {
  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <PeekSlider dir="rtl" loop disableDrag={false}>
        <PeekSliderItem><Card title="A" text="First card" /></PeekSliderItem>
        <PeekSliderItem><Card title="B" text="Second card" /></PeekSliderItem>
        <PeekSliderItem><Card title="C" text="Third card" /></PeekSliderItem>
        <PeekSliderItem><Card title="D" text="Fourth card" /></PeekSliderItem>
        <PeekSliderItem><Card title="E" text="Fifth card" /></PeekSliderItem>
      </PeekSlider>
    </div>
  );
}
