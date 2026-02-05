'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { toJalaali, toGregorian } from 'jalaali-js';
import { PiCalendar, PiX, PiCheck, PiArrowLeft, PiArrowRight } from 'react-icons/pi';
import { Button } from '@/src/components/ui/Button';

export interface ShamsiDateRangePickerProps {
  label?: string;
  checkInDate?: string; // Gregorian date in YYYY-MM-DD format
  checkOutDate?: string; // Gregorian date in YYYY-MM-DD format
  onChange?: (checkIn: string, checkOut: string) => void;
  minDate?: string; // Gregorian date in YYYY-MM-DD format
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

// Format Shamsi date for display
function formatShamsiDate(year: number, month: number, day: number): string {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

export const ShamsiDateRangePicker: React.FC<ShamsiDateRangePickerProps> = ({
  label,
  checkInDate,
  checkOutDate,
  onChange,
  minDate,
  disabled = false,
  required = false,
  error,
  className = '',
  minYear = 1404,
  maxYear = 1410,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<{ year: number; month: number; day: number } | null>(null);
  const [tempCheckOut, setTempCheckOut] = useState<{ year: number; month: number; day: number } | null>(null);

  // Initialize dates
  useEffect(() => {
    if (checkInDate) {
      const shamsi = gregorianToShamsi(checkInDate);
      if (shamsi) setTempCheckIn(shamsi);
    }
    if (checkOutDate) {
      const shamsi = gregorianToShamsi(checkOutDate);
      if (shamsi) setTempCheckOut(shamsi);
    }
  }, [checkInDate, checkOutDate]);

  // Get today in Shamsi
  const getTodayShamsi = (): { year: number; month: number; day: number } => {
    const today = new Date();
    const jalaali = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return { year: jalaali.jy, month: jalaali.jm, day: jalaali.jd };
  };

  const todayShamsi = getTodayShamsi();
  const minShamsi = minDate ? gregorianToShamsi(minDate) : todayShamsi;

  // Get available years
  const availableYears = useMemo(() => {
    const years: number[] = [];
    const startYear = minShamsi?.year ? Math.max(minYear, minShamsi.year) : minYear;
    for (let y = startYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear, minShamsi]);

  // Initialize dates when modal opens
  useEffect(() => {
    if (isOpen) {
      // Initialize check-in if not set (from props or default)
      if (!tempCheckIn) {
        if (checkInDate) {
          const shamsi = gregorianToShamsi(checkInDate);
          if (shamsi) {
            setTempCheckIn(shamsi);
          } else {
            setTempCheckIn(minShamsi || todayShamsi);
          }
        } else {
          setTempCheckIn(minShamsi || todayShamsi);
        }
      }

      // Initialize check-out if not set (from props or one day after check-in)
      if (!tempCheckOut) {
        if (checkOutDate) {
          const shamsi = gregorianToShamsi(checkOutDate);
          if (shamsi) {
            setTempCheckOut(shamsi);
          } else {
            // Fallback: set to one day after check-in
            const checkInToUse = tempCheckIn || minShamsi || todayShamsi;
            const checkInGregorian = shamsiToGregorian(checkInToUse.year, checkInToUse.month, checkInToUse.day);
            if (checkInGregorian) {
              const nextDay = new Date(checkInGregorian);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayShamsi = gregorianToShamsi(nextDay.toISOString().split('T')[0]);
              if (nextDayShamsi) {
                setTempCheckOut(nextDayShamsi);
              } else {
                // Manual increment as fallback
                const fallback = { ...checkInToUse, day: checkInToUse.day + 1 };
                const maxDays = getDaysInPersianMonth(fallback.year, fallback.month);
                if (fallback.day > maxDays) {
                  fallback.day = 1;
                  fallback.month += 1;
                  if (fallback.month > 12) {
                    fallback.month = 1;
                    fallback.year += 1;
                  }
                }
                setTempCheckOut(fallback);
              }
            } else {
              // Manual increment as last resort
              const checkInToUse = tempCheckIn || minShamsi || todayShamsi;
              const fallback = { ...checkInToUse, day: checkInToUse.day + 1 };
              const maxDays = getDaysInPersianMonth(fallback.year, fallback.month);
              if (fallback.day > maxDays) {
                fallback.day = 1;
                fallback.month += 1;
                if (fallback.month > 12) {
                  fallback.month = 1;
                  fallback.year += 1;
                }
              }
              setTempCheckOut(fallback);
            }
          }
        } else {
          // No check-out date: set to one day after check-in
          const checkInToUse = tempCheckIn || minShamsi || todayShamsi;
          const checkInGregorian = shamsiToGregorian(checkInToUse.year, checkInToUse.month, checkInToUse.day);
          if (checkInGregorian) {
            const nextDay = new Date(checkInGregorian);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayShamsi = gregorianToShamsi(nextDay.toISOString().split('T')[0]);
            if (nextDayShamsi) {
              setTempCheckOut(nextDayShamsi);
            } else {
              // Manual increment as fallback
              const fallback = { ...checkInToUse, day: checkInToUse.day + 1 };
              const maxDays = getDaysInPersianMonth(fallback.year, fallback.month);
              if (fallback.day > maxDays) {
                fallback.day = 1;
                fallback.month += 1;
                if (fallback.month > 12) {
                  fallback.month = 1;
                  fallback.year += 1;
                }
              }
              setTempCheckOut(fallback);
            }
          } else {
            // Manual increment as last resort
            const fallback = { ...checkInToUse, day: checkInToUse.day + 1 };
            const maxDays = getDaysInPersianMonth(fallback.year, fallback.month);
            if (fallback.day > maxDays) {
              fallback.day = 1;
              fallback.month += 1;
              if (fallback.month > 12) {
                fallback.month = 1;
                fallback.year += 1;
              }
            }
            setTempCheckOut(fallback);
          }
        }
      }
    }
  }, [isOpen, tempCheckIn, tempCheckOut, checkInDate, checkOutDate, minShamsi, todayShamsi]);

  // Get available months for check-in
  const availableMonthsCheckIn = useMemo(() => {
    if (!tempCheckIn) return [];
    const months: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (minShamsi && tempCheckIn.year === minShamsi.year && m < minShamsi.month) continue;
      months.push(m);
    }
    return months;
  }, [tempCheckIn, minShamsi]);

  // Get available days for check-in
  const availableDaysCheckIn = useMemo(() => {
    if (!tempCheckIn) return [];
    const maxDays = getDaysInPersianMonth(tempCheckIn.year, tempCheckIn.month);
    const days: number[] = [];
    let startDay = 1;
    let endDay = maxDays;

    if (minShamsi && tempCheckIn.year === minShamsi.year && tempCheckIn.month === minShamsi.month) {
      startDay = minShamsi.day;
    }

    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    return days;
  }, [tempCheckIn, minShamsi]);

  // Get available months for check-out
  const availableMonthsCheckOut = useMemo(() => {
    if (!tempCheckOut) return [];
    const months: number[] = [];
    for (let m = 1; m <= 12; m++) {
      if (minShamsi && tempCheckOut.year === minShamsi.year && m < minShamsi.month) continue;
      months.push(m);
    }
    return months;
  }, [tempCheckOut, minShamsi]);

  // Get available days for check-out
  const availableDaysCheckOut = useMemo(() => {
    if (!tempCheckOut) return [];
    const maxDays = getDaysInPersianMonth(tempCheckOut.year, tempCheckOut.month);
    const days: number[] = [];
    let startDay = 1;
    let endDay = maxDays;

    if (minShamsi && tempCheckOut.year === minShamsi.year && tempCheckOut.month === minShamsi.month) {
      startDay = minShamsi.day;
    }

    // Ensure check-out is after check-in
    if (tempCheckIn) {
      const checkInGregorian = shamsiToGregorian(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day);
      if (checkInGregorian && tempCheckOut.year === tempCheckIn.year && tempCheckOut.month === tempCheckIn.month) {
        startDay = Math.max(startDay, tempCheckIn.day + 1);
      }
    }

    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    return days;
  }, [tempCheckOut, tempCheckIn, minShamsi]);

  // Adjust day when month/year changes for check-in
  useEffect(() => {
    if (tempCheckIn) {
      const maxDays = getDaysInPersianMonth(tempCheckIn.year, tempCheckIn.month);
      if (tempCheckIn.day > maxDays) {
        setTempCheckIn({ ...tempCheckIn, day: maxDays });
      }
    }
  }, [tempCheckIn?.year, tempCheckIn?.month]);

  // Adjust day when month/year changes for check-out
  useEffect(() => {
    if (tempCheckOut) {
      const maxDays = getDaysInPersianMonth(tempCheckOut.year, tempCheckOut.month);
      if (tempCheckOut.day > maxDays) {
        setTempCheckOut({ ...tempCheckOut, day: maxDays });
      }
    }
  }, [tempCheckOut?.year, tempCheckOut?.month]);

  const handleCheckInYearChange = (year: number) => {
    if (tempCheckIn) {
      setTempCheckIn({ ...tempCheckIn, year });
    }
  };

  const handleCheckInMonthChange = (month: number) => {
    if (tempCheckIn) {
      const maxDays = getDaysInPersianMonth(tempCheckIn.year, month);
      setTempCheckIn({ ...tempCheckIn, month, day: Math.min(tempCheckIn.day, maxDays) });
    }
  };

  const handleCheckInDayChange = (day: number) => {
    if (tempCheckIn) {
      setTempCheckIn({ ...tempCheckIn, day });
    }
  };

  const handleCheckOutYearChange = (year: number) => {
    if (tempCheckOut) {
      setTempCheckOut({ ...tempCheckOut, year });
    }
  };

  const handleCheckOutMonthChange = (month: number) => {
    if (tempCheckOut) {
      const maxDays = getDaysInPersianMonth(tempCheckOut.year, month);
      setTempCheckOut({ ...tempCheckOut, month, day: Math.min(tempCheckOut.day, maxDays) });
    }
  };

  const handleCheckOutDayChange = (day: number) => {
    if (tempCheckOut) {
      setTempCheckOut({ ...tempCheckOut, day });
    }
  };

  const handleConfirm = () => {
    if (tempCheckIn && tempCheckOut && onChange) {
      const checkInGregorian = shamsiToGregorian(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day);
      const checkOutGregorian = shamsiToGregorian(tempCheckOut.year, tempCheckOut.month, tempCheckOut.day);
      
      if (checkInGregorian && checkOutGregorian) {
        // Validate check-out is after check-in
        const checkIn = new Date(checkInGregorian);
        const checkOut = new Date(checkOutGregorian);
        if (checkOut > checkIn) {
          onChange(checkInGregorian, checkOutGregorian);
          setIsOpen(false);
        }
      }
    }
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      // Dates will be initialized by useEffect when isOpen becomes true
    }
  };

  // Calculate nights
  const nights = useMemo(() => {
    if (!tempCheckIn || !tempCheckOut) return 0;
    const checkInGregorian = shamsiToGregorian(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day);
    const checkOutGregorian = shamsiToGregorian(tempCheckOut.year, tempCheckOut.month, tempCheckOut.day);
    if (!checkInGregorian || !checkOutGregorian) return 0;
    const checkIn = new Date(checkInGregorian);
    const checkOut = new Date(checkOutGregorian);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [tempCheckIn, tempCheckOut]);

  // Display text
  const displayText = useMemo(() => {
    if (checkInDate && checkOutDate) {
      const checkInShamsi = gregorianToShamsi(checkInDate);
      const checkOutShamsi = gregorianToShamsi(checkOutDate);
      if (checkInShamsi && checkOutShamsi) {
        const nightsCount = Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${formatShamsiDate(checkInShamsi.year, checkInShamsi.month, checkInShamsi.day)} تا ${formatShamsiDate(checkOutShamsi.year, checkOutShamsi.month, checkOutShamsi.day)}`;
      }
    }
    return 'انتخاب تاریخ ورود و خروج';
  }, [checkInDate, checkOutDate]);

  // Nights count for display
  const nightsCount = useMemo(() => {
    if (checkInDate && checkOutDate) {
      return Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    return 0;
  }, [checkInDate, checkOutDate]);

  // Validate that check-out is after check-in
  const isValidDateRange = useMemo(() => {
    if (!tempCheckIn || !tempCheckOut) return false;
    const checkInGregorian = shamsiToGregorian(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day);
    const checkOutGregorian = shamsiToGregorian(tempCheckOut.year, tempCheckOut.month, tempCheckOut.day);
    if (!checkInGregorian || !checkOutGregorian) return false;
    const checkIn = new Date(checkInGregorian);
    const checkOut = new Date(checkOutGregorian);
    return checkOut > checkIn;
  }, [tempCheckIn, tempCheckOut]);

  const canConfirm = tempCheckIn && tempCheckOut && nights > 0 && isValidDateRange;

  return (
    <>
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
          <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
            <PiCalendar className="h-4 w-4" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={[
            'w-full px-4 py-3.5 rounded-lg border text-sm text-right',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            'hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors',
            error ? 'border-red-500 dark:border-red-400' : '',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-right">
              <div className={checkInDate && checkOutDate ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                {displayText}
              </div>
              {nightsCount > 0 && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  {nightsCount} {nightsCount === 1 ? 'شب' : 'شب'} اقامت
                </div>
              )}
            </div>
            <PiCalendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          </div>
        </button>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50" dir="rtl">
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">انتخاب تاریخ</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  aria-label="بستن"
                >
                  <PiX className="h-5 w-5" />
                </button>
              </div>

              {/* Check-in Date */}
              {tempCheckIn && (
                <div className="mb-4">
                  <fieldset className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50/50 dark:bg-gray-900/30">
                    <legend className="px-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      تاریخ ورود
                    </legend>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {/* Year */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          سال
                        </label>
                        <select
                          value={tempCheckIn.year}
                          onChange={(e) => handleCheckInYearChange(Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          ماه
                        </label>
                        <select
                          value={tempCheckIn.month}
                          onChange={(e) => handleCheckInMonthChange(Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        >
                          {availableMonthsCheckIn.map((month) => (
                            <option key={month} value={month}>
                              {PERSIAN_MONTHS[month - 1]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Day */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          روز
                        </label>
                        <select
                          value={tempCheckIn.day}
                          onChange={(e) => handleCheckInDayChange(Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        >
                          {availableDaysCheckIn.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        انتخاب شده: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatShamsiDate(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day)}</span>
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Check-out Date */}
              {tempCheckOut && (
                <div className="mb-4">
                  <fieldset className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50/50 dark:bg-gray-900/30">
                    <legend className="px-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      تاریخ خروج
                    </legend>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {/* Year */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          سال
                        </label>
                        <select
                          value={tempCheckOut.year}
                          onChange={(e) => handleCheckOutYearChange(Number(e.target.value))}
                          disabled={!tempCheckIn}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          ماه
                        </label>
                        <select
                          value={tempCheckOut.month}
                          onChange={(e) => handleCheckOutMonthChange(Number(e.target.value))}
                          disabled={!tempCheckIn}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        >
                          {availableMonthsCheckOut.map((month) => (
                            <option key={month} value={month}>
                              {PERSIAN_MONTHS[month - 1]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Day */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          روز
                        </label>
                        <select
                          value={tempCheckOut.day}
                          onChange={(e) => handleCheckOutDayChange(Number(e.target.value))}
                          disabled={!tempCheckIn}
                          className="w-full px-3 py-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        >
                          {availableDaysCheckOut.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        انتخاب شده: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatShamsiDate(tempCheckOut.year, tempCheckOut.month, tempCheckOut.day)}</span>
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Nights Summary - Clear and Prominent */}
              {tempCheckIn && tempCheckOut && nights > 0 && (
                <div className="mb-6 p-4 border-2 border-emerald-500 dark:border-emerald-400 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm">
                        <span className="text-xl font-bold text-white">{nights}</span>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-0.5">
                          مدت اقامت
                        </div>
                        <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                          {nights} {nights === 1 ? 'شب' : 'شب'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">از</div>
                      <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                        {tempCheckIn && formatShamsiDate(tempCheckIn.year, tempCheckIn.month, tempCheckIn.day)}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 my-1">تا</div>
                      <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                        {tempCheckOut && formatShamsiDate(tempCheckOut.year, tempCheckOut.month, tempCheckOut.day)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  leftIcon={<PiCheck className="h-4 w-4" />}
                >
                  {nights > 0 ? `تأیید (${nights} شب)` : 'تأیید'}
                </Button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
