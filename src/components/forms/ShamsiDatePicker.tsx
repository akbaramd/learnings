'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toJalaali, toGregorian } from 'jalaali-js';
import { PiCalendar } from 'react-icons/pi';

export interface ShamsiDatePickerProps {
  label?: string;
  value?: string; // Gregorian date in YYYY-MM-DD format
  onChange?: (gregorianDate: string) => void;
  minDate?: string; // Gregorian date in YYYY-MM-DD format
  maxDate?: string; // Gregorian date in YYYY-MM-DD format
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

// Get number of days in a Persian month
function getDaysInPersianMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Esfand (month 12) - check if it's a leap year
  const gregorian = toGregorian(year, 12, 1);
  const nextGregorian = toGregorian(year + 1, 1, 1);
  const daysDiff = Math.floor(
    (new Date(nextGregorian.gy, nextGregorian.gm - 1, nextGregorian.gd).getTime() -
      new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return daysDiff;
}

// Convert Gregorian to Shamsi
function gregorianToShamsi(gregorianDate: string): { year: number; month: number; day: number } | null {
  if (!gregorianDate) return null;
  try {
    const date = new Date(gregorianDate + 'T12:00:00');
    if (isNaN(date.getTime())) return null;
    const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { year: jalaali.jy, month: jalaali.jm, day: jalaali.jd };
  } catch {
    return null;
  }
}

// Convert Shamsi to Gregorian
function shamsiToGregorian(year: number, month: number, day: number): string {
  try {
    const gregorian = toGregorian(year, month, day);
    const yearStr = String(gregorian.gy).padStart(4, '0');
    const monthStr = String(gregorian.gm).padStart(2, '0');
    const dayStr = String(gregorian.gd).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  } catch {
    return '';
  }
}

export const ShamsiDatePicker: React.FC<ShamsiDatePickerProps> = ({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  required = false,
  error,
  className = '',
  minYear = 1404,
  maxYear = 1410,
}) => {
  // Initialize with current date or provided value
  const getInitialShamsi = (): { year: number; month: number; day: number } => {
    if (value) {
      const shamsi = gregorianToShamsi(value);
      if (shamsi) return shamsi;
    }
    // Default to today in Shamsi
    const today = new Date();
    const jalaali = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return { year: jalaali.jy, month: jalaali.jm, day: jalaali.jd };
  };

  const [shamsiDate, setShamsiDate] = useState<{ year: number; month: number; day: number }>(getInitialShamsi);

  // Update shamsi date when value prop changes
  useEffect(() => {
    if (value) {
      const shamsi = gregorianToShamsi(value);
      if (shamsi) {
        setShamsiDate(shamsi);
      }
    }
  }, [value]);

  // Calculate min/max Shamsi dates from Gregorian
  const minShamsi = useMemo(() => {
    if (!minDate) return null;
    return gregorianToShamsi(minDate);
  }, [minDate]);

  const maxShamsi = useMemo(() => {
    if (!maxDate) return null;
    return gregorianToShamsi(maxDate);
  }, [maxDate]);

  // Get available years
  const availableYears = useMemo(() => {
    const years: number[] = [];
    const startYear = minShamsi?.year ? Math.max(minYear, minShamsi.year) : minYear;
    const endYear = maxShamsi?.year ? Math.min(maxYear, maxShamsi.year) : maxYear;
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear, minShamsi, maxShamsi]);

  // Get available months for selected year
  const availableMonths = useMemo(() => {
    const months: number[] = [];
    for (let m = 1; m <= 12; m++) {
      // Check if month is within min/max range
      if (minShamsi && shamsiDate.year === minShamsi.year && m < minShamsi.month) continue;
      if (maxShamsi && shamsiDate.year === maxShamsi.year && m > maxShamsi.month) continue;
      months.push(m);
    }
    return months;
  }, [shamsiDate.year, minShamsi, maxShamsi]);

  // Get available days for selected year and month
  const availableDays = useMemo(() => {
    const maxDays = getDaysInPersianMonth(shamsiDate.year, shamsiDate.month);
    const days: number[] = [];
    let startDay = 1;
    let endDay = maxDays;

    // Apply min date constraint
    if (minShamsi && shamsiDate.year === minShamsi.year && shamsiDate.month === minShamsi.month) {
      startDay = minShamsi.day;
    }

    // Apply max date constraint
    if (maxShamsi && shamsiDate.year === maxShamsi.year && shamsiDate.month === maxShamsi.month) {
      endDay = maxShamsi.day;
    }

    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    return days;
  }, [shamsiDate.year, shamsiDate.month, minShamsi, maxShamsi]);

  // Validate and adjust day when month/year changes
  useEffect(() => {
    const maxDays = getDaysInPersianMonth(shamsiDate.year, shamsiDate.month);
    if (shamsiDate.day > maxDays) {
      setShamsiDate((prev) => ({ ...prev, day: maxDays }));
    }
  }, [shamsiDate.year, shamsiDate.month]);

  const handleYearChange = (year: number) => {
    const newDate = { ...shamsiDate, year };
    setShamsiDate(newDate);
    const gregorian = shamsiToGregorian(newDate.year, newDate.month, newDate.day);
    if (gregorian && onChange) {
      onChange(gregorian);
    }
  };

  const handleMonthChange = (month: number) => {
    const newDate = { ...shamsiDate, month };
    // Adjust day if needed
    const maxDays = getDaysInPersianMonth(newDate.year, newDate.month);
    if (newDate.day > maxDays) {
      newDate.day = maxDays;
    }
    setShamsiDate(newDate);
    const gregorian = shamsiToGregorian(newDate.year, newDate.month, newDate.day);
    if (gregorian && onChange) {
      onChange(gregorian);
    }
  };

  const handleDayChange = (day: number) => {
    const newDate = { ...shamsiDate, day };
    setShamsiDate(newDate);
    const gregorian = shamsiToGregorian(newDate.year, newDate.month, newDate.day);
    if (gregorian && onChange) {
      onChange(gregorian);
    }
  };

  const displayText = `${shamsiDate.year}/${String(shamsiDate.month).padStart(2, '0')}/${String(shamsiDate.day).padStart(2, '0')}`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
          <PiCalendar className="h-4 w-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        {/* Year Select */}
        <select
          value={shamsiDate.year}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          disabled={disabled}
          className={[
            'flex-1 px-3 py-2.5 rounded-lg border text-sm',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            error ? 'border-red-500 dark:border-red-400' : '',
          ].join(' ')}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Month Select */}
        <select
          value={shamsiDate.month}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          disabled={disabled}
          className={[
            'flex-1 px-3 py-2.5 rounded-lg border text-sm',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            error ? 'border-red-500 dark:border-red-400' : '',
          ].join(' ')}
        >
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {PERSIAN_MONTHS[month - 1]}
            </option>
          ))}
        </select>

        {/* Day Select */}
        <select
          value={shamsiDate.day}
          onChange={(e) => handleDayChange(Number(e.target.value))}
          disabled={disabled}
          className={[
            'flex-1 px-3 py-2.5 rounded-lg border text-sm',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            error ? 'border-red-500 dark:border-red-400' : '',
          ].join(' ')}
        >
          {availableDays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      {/* Display selected date */}
      <div className="text-xs text-gray-600 dark:text-gray-400 px-1">
        تاریخ انتخاب شده: <span className="font-medium">{displayText}</span>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
