import type { Application } from './scholarshipData';

/** Local "YYYY-MM-DD" */
export function toDateInputValue(date: Date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> local Date at midnight */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "2026-10-05" -> "Oct 05, 2026" */
export function formatDisplayDate(value: string): string {
  return parseISODate(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

/** Whole days from today until an ISO date (negative when it already passed) */
export function daysUntil(value: string): number {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((parseISODate(value).getTime() - todayStart) / 86_400_000);
}

/** Is today between start and end (inclusive)? */
export function isWithinPeriod(start: string, end: string): boolean {
  return daysUntil(start) <= 0 && daysUntil(end) >= 0;
}

export function daysLeftLabel(value: string): string {
  const days = daysUntil(value);
  if (days <= 0) return 'Last day';
  return days === 1 ? '1 day left' : `${days} days left`;
}

/** "CVLB-2026-00004". TODO (Supabase): let the database generate this (sequence/trigger). */
export function nextApplicationId(applications: Pick<Application, 'applicationId'>[], prefix: string, year: number): string {
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{5})$`);
  const next =
    applications.reduce((max, a) => {
      const match = a.applicationId.match(pattern);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
}

/** "09171234567" -> "0917-123-4567" */
export function formatPhone(value = ''): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}