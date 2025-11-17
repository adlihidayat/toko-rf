// lib/utils/date.ts

/**
 * Safely convert a date to Date object, handling undefined values
 */
export function toDate(date: Date | undefined | string | number): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
}

/**
 * Safely format a date, handling undefined values
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return 'N/A';
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleDateString('id-ID');
}

/**
 * Safely get time ago string
 */
export function getTimeAgo(date: Date | undefined): string {
  if (!date) return 'Recently';
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date);
}

/**
 * Ensure a date is always defined
 */
export function ensureDate(date: Date | undefined): Date {
  return date instanceof Date ? date : new Date();
}

/**
 * Safely ensure string is not undefined
 */
export function ensureString(value: string | undefined, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Type guard for checking if value has _id
 */
export function hasId<T extends { _id?: string }>(obj: T): obj is T & { _id: string } {
  return typeof obj._id === 'string';
}