import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The business runs on India time (matches public.business_today() in the database).
const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

/** Today's date in the business time zone, as YYYY-MM-DD. */
export function businessToday(): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE }).format(new Date());
}

/** True when a due date (YYYY-MM-DD) is before today in the business time zone. */
export function isOverdue(dueDate: string | null | undefined): boolean {
  return !!dueDate && dueDate.slice(0, 10) < businessToday();
}

/**
 * Formats a date for display, e.g. "21 Oct 2026". Date-only values
 * (YYYY-MM-DD) are calendar dates and are never shifted by time zone;
 * timestamps are shown in the business time zone. Safe on server and client.
 */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-IN', { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  // Postgres timestamps cast to text ("2026-10-21 10:15:00.12+00") aren't
  // ISO 8601; normalise them so every browser parses them the same way.
  const normalised = typeof value === 'string'
    ? value.replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, '$1T$2').replace(/([+-]\d{2})$/, '$1:00')
    : value;
  const date = new Date(normalised);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', { ...options, timeZone: BUSINESS_TIME_ZONE }).format(date);
}

export function formatReadableDate(dateString: string | number | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
