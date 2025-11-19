'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export interface ScrollableAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * Hide scrollbar completely
   * @default true
   */
  hideScrollbar?: boolean;
  /**
   * Show thin scrollbar (only if hideScrollbar is false)
   * @default false
   */
  thinScrollbar?: boolean;
  /**
   * Scroll direction
   * @default 'y'
   */
  direction?: 'x' | 'y' | 'both';
  /**
   * Enable smooth scrolling
   * @default false
   */
  smooth?: boolean;
  className?: string;
}

export const ScrollableArea = forwardRef<HTMLDivElement, ScrollableAreaProps>(
  function ScrollableArea(
    {
      children,
      hideScrollbar = true,
      thinScrollbar = false,
      direction = 'y',
      smooth = false,
      className = '',
      ...rest
    },
    ref
  ) {
    const overflowClasses = (() => {
      if (direction === 'x') return 'overflow-x-auto overflow-y-hidden';
      if (direction === 'both') return 'overflow-auto';
      return 'overflow-y-auto overflow-x-hidden'; // default 'y'
    })();

    // Build classes
    // min-h-0 is CRITICAL for flex layouts - allows scrolling to work properly
    // flex-1 or h-full can be provided via className if needed
    const classes = [
      'relative',
      'min-h-0', // Critical for flex scrolling - prevents flex item from overflowing
      overflowClasses,
      smooth && 'scroll-smooth',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
        <style jsx>{`
          div {
            ${hideScrollbar
              ? `
              scrollbar-width: none;
              -ms-overflow-style: none;
            `
              : thinScrollbar
                ? `
              scrollbar-width: thin;
              scrollbar-color: #9CA3AF #F3F4F6;
            `
                : ''}
          }
          
          div::-webkit-scrollbar {
            ${hideScrollbar
              ? `
              width: 0;
              height: 0;
              display: none;
            `
              : thinScrollbar
                ? `
              width: 6px;
              height: 6px;
            `
                : ''}
          }
          
          div::-webkit-scrollbar-track {
            ${hideScrollbar
              ? `
              background: transparent;
            `
              : thinScrollbar
                ? `
              background: #F3F4F6;
            `
                : ''}
          }
          
          div::-webkit-scrollbar-thumb {
            ${hideScrollbar
              ? `
              background: transparent;
            `
              : thinScrollbar
                ? `
              background: #9CA3AF;
              border-radius: 3px;
            `
                : ''}
          }
          
          div::-webkit-scrollbar-thumb:hover {
            ${!hideScrollbar && thinScrollbar
              ? `
              background: #6B7280;
            `
              : ''}
          }
          
          .dark div {
            ${!hideScrollbar && thinScrollbar
              ? `
              scrollbar-color: #4B5563 #1F2937;
            `
              : ''}
          }
          
          .dark div::-webkit-scrollbar-track {
            ${!hideScrollbar && thinScrollbar
              ? `
              background: #1F2937;
            `
              : ''}
          }
          
          .dark div::-webkit-scrollbar-thumb {
            ${!hideScrollbar && thinScrollbar
              ? `
              background: #4B5563;
            `
              : ''}
          }
          
          .dark div::-webkit-scrollbar-thumb:hover {
            ${!hideScrollbar && thinScrollbar
              ? `
              background: #6B7280;
            `
              : ''}
          }
        `}</style>
      </div>
    );
  }
);

export default ScrollableArea;

