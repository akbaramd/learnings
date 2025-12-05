'use client';

import React from 'react';
import Card from '../ui/Card';

/* =========================================================
   Types
========================================================= */

export type Service = {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  disabled?: boolean;
};

type ServiceCardProps = {
  s: Service;
  onClick?: (id: string) => void;
  /** Highlight the primary action (optional) */
  active?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
};

/* =========================================================
   Accent helpers (consistent color system)
========================================================= */

function accentClasses(accent: string, disabled?: boolean) {
  if (disabled) {
    return {
      card: 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500',
      iconWrap:
        'bg-gray-100/70 dark:bg-gray-700/60 ring-1 ring-gray-200/80 dark:ring-gray-600/60',
      title: 'text-gray-400 dark:text-gray-500',
      hover: '',
    };
  }

  const map: Record<
    string,
    { card: string; iconWrap: string; title: string; hover: string }
  > = {
    emerald: {
      card:
        'border-gray-200 bg-emerald-50 text-emerald-800 dark:border-gray-700 dark:bg-emerald-900/30 dark:text-emerald-200',
      iconWrap:
        'bg-emerald-100/70 dark:bg-emerald-800/50 ring-1 ring-emerald-200/80 dark:ring-emerald-700/60',
      title: 'text-emerald-800 dark:text-emerald-200',
      hover:
        'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-[0_6px_20px_-8px_rgba(16,185,129,0.6)]',
    },
    blue: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-blue-100/70 dark:bg-blue-900/30 ring-1 ring-blue-200/80 dark:ring-blue-800/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover:
        'hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:shadow-[0_6px_20px_-8px_rgba(59,130,246,0.45)]',
    },
    indigo: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-indigo-100/70 dark:bg-indigo-900/30 ring-1 ring-indigo-200/80 dark:ring-indigo-800/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover:
        'hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 hover:shadow-[0_6px_20px_-8px_rgba(99,102,241,0.45)]',
    },
    amber: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-amber-100/70 dark:bg-amber-900/30 ring-1 ring-amber-200/80 dark:ring-amber-800/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover:
        'hover:bg-amber-50/60 dark:hover:bg-amber-900/20 hover:shadow-[0_6px_20px_-8px_rgba(245,158,11,0.45)]',
    },
    rose: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-rose-100/70 dark:bg-rose-900/30 ring-1 ring-rose-200/80 dark:ring-rose-800/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover:
        'hover:bg-rose-50/60 dark:hover:bg-rose-900/20 hover:shadow-[0_6px_20px_-8px_rgba(244,63,94,0.45)]',
    },
    cyan: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-cyan-100/70 dark:bg-cyan-900/30 ring-1 ring-cyan-200/80 dark:ring-cyan-800/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover:
        'hover:bg-cyan-50/60 dark:hover:bg-cyan-900/20 hover:shadow-[0_6px_20px_-8px_rgba(6,182,212,0.45)]',
    },
    gray: {
      card:
        'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
      iconWrap:
        'bg-gray-100/70 dark:bg-gray-700/60 ring-1 ring-gray-200/80 dark:ring-gray-600/60',
      title: 'text-gray-800 dark:text-gray-200',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-700/80',
    },
  };

  return map[accent] ?? map.gray;
}

/* =========================================================
   ServiceCard (accessible, polished, micro-interactions)
========================================================= */

export function ServiceCard({ s, onClick, active, className, dir }: ServiceCardProps) {
  const Icon = s.icon;

  return (
    <button
      dir={dir}
      onClick={() => !s.disabled && onClick?.(s.id)}
      disabled={s.disabled}
      className={[
        'rounded-2xl p-4 text-center transition-all active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'bg-white hover:bg-gray-50 border border-gray-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:border-slate-700',
        className || '',
      ].join(' ')}
    >
      <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${s.bgColor}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      <p className="text-xs text-gray-700 dark:text-slate-300">
        {s.title}
      </p>
    </button>
  );
}

/* =========================================================
   ServicesGrid (responsive, roomy)
========================================================= */

export function ServicesGrid({
  items,
  onSelect,
  activeId,
  dir = 'rtl',
  className,
}: {
  items: Service[];
  onSelect?: (id: string) => void;
  activeId?: string;
  dir?: 'rtl' | 'ltr';
  className?: string;
}) {
  return (
    <div dir={dir} className={['grid gap-3 grid-cols-3', className || ''].join(' ')}>
      {items.map((s) => (
        <ServiceCard
          key={s.id}
          s={s}
          active={activeId === s.id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

