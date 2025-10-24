'use client';

import {
  forwardRef,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { px } from '../lib/css';

type Dir = 'x' | 'y' | 'both';

export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children?: ReactNode;

  direction?: Dir;                 // 'x' | 'y' | 'both'   (default: 'y')
  smooth?: boolean;                // scroll-behavior: smooth
  hideScrollbar?: boolean;         // visually hide scrollbars
  thinScrollbar?: boolean;         // minimal scrollbar styling

  // size constraints for the viewport
  w?: number | string;
  h?: number | string;
  maxW?: number | string;
  maxH?: number | string;

  // optional padding
  p?: number | string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    children,
    className,
    style,

    direction = 'y',
    smooth = false,
    hideScrollbar = false,
    thinScrollbar = true,

    w,
    h,
    maxW,
    maxH,
    p,

    ...rest
  },
  ref
) {
  const overflowClasses = useMemo(() => {
    if (direction === 'x') return 'overflow-x-auto overflow-y-hidden';
    if (direction === 'both') return 'overflow-auto';
    return 'overflow-y-auto overflow-x-hidden'; // default 'y'
  }, [direction]);

  const classes = cn(
    'relative',
    overflowClasses,
    smooth && 'scroll-smooth',
    className
  );

  const styles: CSSProperties = {
    width: px(w),
    height: px(h),
    maxWidth: px(maxW),
    maxHeight: px(maxH),
    padding: px(p),
    ...style,
  };

  return (
    <div ref={ref} className={classes} style={styles} {...rest}>
      {children}

      {/* Scoped scrollbar CSS – only applies to this container */}
      <style jsx>{`
        div::-webkit-scrollbar {
          ${hideScrollbar ? 'width: 0; height: 0;' : thinScrollbar ? 'width: 8px; height: 8px;' : ''}
        }
        div::-webkit-scrollbar-track {
          ${hideScrollbar ? 'background: transparent;' : thinScrollbar ? 'background: transparent;' : ''}
        }
        div::-webkit-scrollbar-thumb {
          ${hideScrollbar ? 'background: transparent;' : thinScrollbar ? 'background: rgba(0,0,0,.25); border-radius: 9999px;' : ''}
        }
        /* Firefox */
        div {
          scrollbar-width: ${hideScrollbar ? 'none' : thinScrollbar ? 'thin' : 'auto'};
          scrollbar-color: ${hideScrollbar ? 'transparent transparent' : 'rgba(0,0,0,.35) transparent'};
        }
      `}</style>
    </div>
  );
});

export default ScrollArea;
