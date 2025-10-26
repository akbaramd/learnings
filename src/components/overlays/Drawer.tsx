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
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
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
  swipeable?: boolean;
  swipeCloseThreshold?: number;
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

/* ---------- helpers ---------- */
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
  if (side === 'left' || side === 'right' || side === 'top' || side === 'bottom') return side;
  if (!rtlAware) return side === 'start' ? 'left' : 'right';
  return dir === 'rtl' ? (side === 'start' ? 'right' : 'left') : (side === 'start' ? 'left' : 'right');
}
function sizeToPx(side: PhysicalSide, size: Size): string {
  const w: Record<Size, string> = { xs: '16rem', sm: '20rem', md: '24rem', lg: '28rem', xl: '32rem', full: '100vw' };
  const h: Record<Size, string> = { xs: '12rem', sm: '16rem', md: '20rem', lg: '24rem', xl: '28rem', full: '100vh' };
  return side === 'left' || side === 'right' ? w[size] : h[size];
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
function axisFor(side: PhysicalSide): 'x' | 'y' {
  return side === 'left' || side === 'right' ? 'x' : 'y';
}

/* ---------- Drawer ---------- */
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
  swipeable = true,
  swipeCloseThreshold = 80,
  className,
  panelClassName,
  backdropClassName,
  zIndexClassName = 'z-50',
  children,
}: DrawerProps) {
  const dir = useDir();
  const physical = useMemo(() => resolveSide(side, dir, rtlAware), [dir, rtlAware, side]);
  const dimension = sizeToPx(physical, size);
  const axis = axisFor(physical);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);

  // Handle animations
  useEffect(() => {
    if (open && !shouldRender) {
      requestAnimationFrame(() => {
        setShouldRender(true);
        // Start animation after mount
        setTimeout(() => setIsAnimating(true), 10);
      });
    } else if (!open && shouldRender) {
      requestAnimationFrame(() => {
        setIsAnimating(false);
        // Unmount after animation
        setTimeout(() => setShouldRender(false), 300);
      });
      // Unmount after animation
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [open, shouldRender]);

  // lock scroll while open
  useEffect(() => {
    if (!lockScroll || !open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [lockScroll, open]);

  // Esc
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, closeOnEsc, onClose]);

  // swipe-to-close
  const drag = useRef({ active: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 });
  function setPanelTranslate(px: number) {
    const node = panelRef.current; if (!node) return;
    node.style.transition = 'none';
    node.style.transform = axis === 'x' ? `translate3d(${px}px,0,0)` : `translate3d(0,${px}px,0)`;
  }
  function clearPanelTranslate() {
    const node = panelRef.current; if (!node) return;
    node.style.transition = ''; node.style.transform = '';
  }
  function pointerDown(e: ReactPointerEvent) {
    if (!swipeable) return;
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, deltaX: 0, deltaY: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e: ReactPointerEvent) {
    if (!drag.current.active) return;
    drag.current.deltaX = e.clientX - drag.current.startX;
    drag.current.deltaY = e.clientY - drag.current.startY;
    let px = 0;
    if (axis === 'x') {
      px = drag.current.deltaX;
      if (physical === 'left')  px = Math.min(0, px);
      if (physical === 'right') px = Math.max(0, px);
    } else {
      px = drag.current.deltaY;
      if (physical === 'top')    px = Math.min(0, px);
      if (physical === 'bottom') px = Math.max(0, px);
    }
    setPanelTranslate(px);
  }
  function pointerUp() {
    if (!drag.current.active) return;
    const abs = axis === 'x' ? Math.abs(drag.current.deltaX) : Math.abs(drag.current.deltaY);
    drag.current.active = false;
    if (abs >= swipeCloseThreshold) {
      clearPanelTranslate(); onClose(false);
    } else {
      const node = panelRef.current;
      if (node) {
        node.style.transition = 'transform 200ms ease-out';
        node.style.transform = 'translate3d(0,0,0)';
        const h = () => { node.style.transition = ''; node.removeEventListener('transitionend', h); };
        node.addEventListener('transitionend', h);
      }
    }
  }

  const panelPos = panelEdgePosition(physical);
  const radius = cornerRadius(physical);
  const root = `fixed inset-0 ${zIndexClassName}`;

  const basePanel =
    'bg-white text-gray-900 shadow-xl border border-gray-200/80 ' +
    'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700/80';

  const sizeStyle: React.CSSProperties =
    physical === 'left' || physical === 'right'
      ? { width: dimension }
      : { height: dimension };

  // Headless UI close reason:
  const dialogOnClose = closeOnBackdrop ? onClose : () => {};

  // Don't render if not needed
  if (!shouldRender) return null;

  // Get animation classes
  const getAnimationClasses = () => {
    if (!isAnimating) return '';
    
    const side = physical;
    const direction = open ? 'enter' : 'exit';
    return `drawer-panel-${side}-${direction}`;
  };

  const getBackdropClasses = () => {
    if (!isAnimating) return '';
    return open ? 'drawer-backdrop-enter' : 'drawer-backdrop-exit';
  };

  return (
    <Dialog
      open={shouldRender}
      onClose={dialogOnClose}
      className={twMerge(root, className)}
    >
      {backdrop && (
        <DialogBackdrop
          className={twMerge(
            'drawer-backdrop fixed inset-0 bg-black/45 backdrop-blur-sm',
            getBackdropClasses(),
            !closeOnBackdrop && 'pointer-events-none',
            backdropClassName
          )}
        />
      )}

      <DialogPanel
        as="div"
        className={twMerge('absolute', panelPos)}
      >
        <div
          ref={panelRef}
          className={twMerge(
            'drawer-panel absolute',
            panelPos,
            basePanel,
            radius,
            'outline-0',
            getAnimationClasses(),
            panelClassName
          )}
          style={sizeStyle}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
        >
          {(physical === 'bottom' || physical === 'top') && (
            <div className="flex justify-center pt-2">
              <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
          )}

          {!hideClose && (
            <div
              className={twMerge(
                'absolute',
                physical === 'left' && 'right-2 top-2',
                physical === 'right' && 'left-2 top-2',
                physical === 'top' && 'right-2 bottom-2',
                physical === 'bottom' && 'right-2 top-2'
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
                  'dark:hover:bg-gray-600 dark:focus:ring-blue-400'
                )}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </CloseButton>
            </div>
          )}

          <div className="h-full w-full overflow-auto">{children}</div>
        </div>
      </DialogPanel>
    </Dialog>
  );
}

Drawer.Header = DrawerHeader;
Drawer.Body = DrawerBody;
Drawer.Footer = DrawerFooter;
