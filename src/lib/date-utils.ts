/**
 * Date utility functions for handling UTC dates and Persian formatting
 */

/**
 * Safely parse a date string, handling UTC timezone properly
 */
export function parseUTCDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);

  // If the string contains timezone info, treat as UTC
  if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-')) {
    return new Date(dateStr);
  } else {
    // If no timezone info, assume it's in local time or add default time
    return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  }
}

/**
 * Format date to Persian with time (HH:MM)
 */
export function formatDateFa(date: Date | string | null | undefined): string {
  if (!date) return 'نامشخص';

  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = parseUTCDate(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return 'نامشخص';

    // Convert UTC to local time for display
    const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(localDate);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return 'نامشخص';
  }
}

/**
 * Format date to Persian date only (no time)
 */
export function formatDateOnlyFa(date: Date | string | null | undefined): string {
  if (!date) return 'نامشخص';

  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = parseUTCDate(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return 'نامشخص';

    // Convert UTC to local time for display
    const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(localDate);
  } catch (error) {
    console.error('Error formatting date only:', error, 'Input:', date);
    return 'نامشخص';
  }
}

/**
 * Format date range in Persian (start - end)
 */
export function formatDateRangeFa(start?: string, end?: string): string {
  if (!start || !end) return 'نامشخص';

  try {
    const s = parseUTCDate(start);
    const e = parseUTCDate(end);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'نامشخص';

    // Convert to local time for display
    const localStart = new Date(s.getTime() - (s.getTimezoneOffset() * 60000));
    const localEnd = new Date(e.getTime() - (e.getTimezoneOffset() * 60000));

    const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'short',
      day: 'numeric',
    });
    return `${fmt.format(localStart)} تا ${fmt.format(localEnd)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'نامشخص';
  }
}

/**
 * Calculate duration in days between two dates
 */
export function formatDurationFa(start?: string, end?: string): string {
  if (!start || !end) return '—';

  try {
    const s = parseUTCDate(start).getTime();
    const e = parseUTCDate(end).getTime();

    if (isNaN(s) || isNaN(e)) return '—';
    const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
    return `${days.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])} روزه`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '—';
  }
}

/**
 * Format currency in Persian
 */
export function formatCurrencyFa(amount: number | null | undefined): string {
  try {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('fa-IR').format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '0';
  }
}
