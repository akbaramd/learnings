'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  CloseButton,
} from '@headlessui/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { twMerge } from 'tailwind-merge';
import './Drawer.css';

type LogicalSide = 'start' | 'end';
type PhysicalSide = 'left' | 'right' | 'top' | 'bottom';
type Side = LogicalSide | PhysicalSide;
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DrawerProps {
  open: boolean;
  onClose: (open: boolean) => void;
  side?: Side;
  size?: Size;
  rtlAware?: boolean;
  backdrop?: boolean;
  hideClose?: boolean;
  lockScroll?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  panelClassName?: string;
  backdropClassName?: string;
  zIndexClassName?: string;
  children?: ReactNode;
}

export function DrawerHeader(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={twMerge(
        'px-4 py-3 border-b border-gray-200/80 bg-white/90 backdrop-blur-[2px]',
        'dark:border-gray-700/80 dark:bg-gray-800/90',
        props.className
      )}
    />
  );
}

export function DrawerBody(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={twMerge(
        'p-4 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        props.className
      )}
    />
  );
}

export function DrawerFooter(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={twMerge(
        'px-4 py-3 border-t border-gray-200/80 bg-white/90 backdrop-blur-[2px]',
        'dark:border-gray-700/80 dark:bg-gray-800/90',
        props.className
      )}
    />
  );
}

/* ---------- Helper Functions ---------- */
function useDir(): 'ltr' | 'rtl' {
  const [dir, setDir] = useState<'ltr' | 'rtl'>(() => {
    if (typeof document === 'undefined') return 'ltr';
    const d = (document.documentElement.getAttribute('dir') || 'ltr').toLowerCase();
    return d === 'rtl' ? 'rtl' : 'ltr';
  });
  
  useEffect(() => {
    const html = document.documentElement;
    const obs = new MutationObserver(() => {
      const d = (html.getAttribute('dir') || 'ltr').toLowerCase();
      setDir(d === 'rtl' ? 'rtl' : 'ltr');
    });
    obs.observe(html, { attributes: true, attributeFilter: ['dir'] });
    return () => obs.disconnect();
  }, []);
  
  return dir;
}

function resolveSide(side: Side, dir: 'ltr' | 'rtl', rtlAware: boolean): PhysicalSide {
  if (side === 'left' || side === 'right' || side === 'top' || side === 'bottom') {
    return side;
  }
  if (!rtlAware) {
    return side === 'start' ? 'left' : 'right';
  }
  return dir === 'rtl' ? (side === 'start' ? 'right' : 'left') : (side === 'start' ? 'left' : 'right');
}

function sizeToPx(side: PhysicalSide, size: Size): string {
  const w: Record<Size, string> = { 
    xs: '16rem', 
    sm: '20rem', 
    md: '24rem', 
    lg: '28rem', 
    xl: '32rem', 
    full: '100vw' 
  };
  const h: Record<Size, string> = { 
    xs: '12rem', 
    sm: '16rem', 
    md: '20rem', 
    lg: '24rem', 
    xl: '28rem', 
    full: '100vh' 
  };
  return side === 'left' || side === 'right' ? w[size] : h[size];
}

function sizeToMinHeight(side: PhysicalSide, size: Size): string {
  if (side === 'left' || side === 'right') return '0';
  const h: Record<Size, string> = { 
    xs: '12rem', 
    sm: '16rem', 
    md: '20rem', 
    lg: '24rem', 
    xl: '28rem', 
    full: '100vh' 
  };
  return h[size];
}

function panelEdgePosition(side: PhysicalSide) {
  switch (side) {
    case 'left': return 'left-0 top-0 h-screen';
    case 'right': return 'right-0 top-0 h-screen';
    case 'top': return 'top-0 left-0 w-screen';
    case 'bottom': return 'bottom-0 left-0 w-screen';
  }
}

function cornerRadius(side: PhysicalSide) {
  switch (side) {
    case 'left': return 'rounded-r-[4px]';
    case 'right': return 'rounded-l-[4px]';
    case 'top': return 'rounded-b-[4px]';
    case 'bottom': return 'rounded-t-[4px]';
  }
}

const ANIMATION_DURATION = 300; // ms

/* ---------- Drawer Component ---------- */
export default function Drawer({
  open,
  onClose,
  side = 'start',
  size = 'md',
  rtlAware = true,
  backdrop = true,
  hideClose = false,
  lockScroll = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
  panelClassName,
  backdropClassName,
  zIndexClassName = 'z-50',
  children,
}: DrawerProps) {
  const dir = useDir();
  const physical = useMemo(() => resolveSide(side, dir, rtlAware), [dir, rtlAware, side]);
  const dimension = sizeToPx(physical, size);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  const isVertical = physical === 'bottom' || physical === 'top';
  const minHeight = sizeToMinHeight(physical, size);

  // Handle open/close state transitions
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (open && !shouldRender) {
      // Opening: mount component
      setIsClosing(false);
      setIsAnimating(true);
      setShouldRender(true);
    } else if (!open && shouldRender) {
      // Closing: animate out
      setIsClosing(true);
      setIsAnimating(false);

      animationTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        animationTimeoutRef.current = null;
      }, ANIMATION_DURATION);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [open, shouldRender, isVertical, size]);

  // Lock scroll while open
  useEffect(() => {
    if (!lockScroll || !open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [lockScroll, open]);

  // ESC key handler
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, closeOnEsc, onClose]);

  // Calculate size style - must be before any conditional returns
  const sizeStyle: React.CSSProperties = useMemo(() => {
    if (physical === 'left' || physical === 'right') {
      return { width: dimension };
    }

    if (isVertical && size !== 'full') {
      return {
        height: 'auto',
        minHeight: minHeight,
        overflowY: 'auto',
      };
    }

    return { height: dimension };
  }, [physical, dimension, isVertical, size, minHeight]);

  // Prevent clicks inside panel from closing drawer
  const handlePanelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle backdrop close
  const handleBackdropClose = useCallback(() => {
    if (closeOnBackdrop) {
      onClose(false);
    }
  }, [closeOnBackdrop, onClose]);

  // Don't render if not needed
  if (!shouldRender) return null;

  const panelPos = panelEdgePosition(physical);
  const radius = cornerRadius(physical);
  const root = `fixed inset-0 ${zIndexClassName}`;

  const basePanel = [
    'bg-white text-gray-900 shadow-xl border border-gray-200/80',
    'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700/80',
  ].join(' ');

  // Animation classes for slide animations
  const animationClasses = isAnimating
    ? `drawer-panel-${physical}-${open ? 'enter' : 'exit'}`
    : '';

  const backdropClasses = isAnimating
    ? open ? 'drawer-backdrop-enter' : 'drawer-backdrop-exit'
    : '';

  return (
    <Dialog
      open={shouldRender}
      onClose={handleBackdropClose}
      className={twMerge(root, className)}
    >
      {backdrop && (
        <DialogBackdrop
          className={twMerge(
            'drawer-backdrop fixed inset-0 bg-black/45 backdrop-blur-sm',
            backdropClasses,
            !closeOnBackdrop && 'pointer-events-none',
            backdropClassName
          )}
        />
      )}

      <DialogPanel
        as="div"
        className={twMerge('absolute', panelPos)}
        onClick={handlePanelClick}
      >
        <div
          ref={panelRef}
          className={twMerge(
            'drawer-panel absolute',
            panelPos,
            basePanel,
            radius,
            'outline-0',
            animationClasses,
            panelClassName
          )}
          style={sizeStyle}
          onClick={handlePanelClick}
        >
          {(physical === 'bottom' || physical === 'top') && (
            <div className="flex justify-center pt-2">
              <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
          )}

          {!hideClose && (
            <div
              className={twMerge(
                'absolute z-10',
                physical === 'left' && 'left-2 top-2',
                physical === 'right' && 'right-2 top-2',
                physical === 'top' && 'left-2 bottom-2',
                physical === 'bottom' && 'left-2 top-2'
              )}
            >
              <CloseButton
                aria-label="Close drawer"
                onClick={() => onClose(false)}
                className={twMerge(
                  'inline-flex h-8 w-8 items-center justify-center',
                  'rounded-[4px] border border-gray-200 bg-white text-gray-600',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300',
                  'dark:hover:bg-gray-600 dark:focus:ring-blue-400',
                  'transition-colors'
                )}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4 w-4" 
                  stroke="currentColor" 
                  fill="none" 
                  strokeWidth={2}
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </CloseButton>
            </div>
          )}

          <div
            ref={contentRef}
            className={twMerge(
              'w-full',
              isVertical && size !== 'full' ? 'overflow-auto' : 'h-full overflow-auto'
            )}
          >
            {children}
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

Drawer.Header = DrawerHeader;
Drawer.Body = DrawerBody;
Drawer.Footer = DrawerFooter;
