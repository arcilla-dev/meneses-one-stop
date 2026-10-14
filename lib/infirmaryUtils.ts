import type { Appointment } from './infirmaryData';

/** Local "YYYY-MM-DD" (what <input type="date"> and a Supabase `date` column use) */
export function toDateInputValue(date: Date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> local Date at midnight (avoids the UTC off-by-one bug of new Date("2026-10-05")) */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "2026-10-05" -> "Oct 05, 2026" */
export function formatDisplayDate(value: string): string {
  return parseISODate(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function dayTimestamp(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "09:30 AM" -> minutes since midnight (Infinity when it can't be parsed) */
export function timeToMinutes(value: string): number {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return Number.POSITIVE_INFINITY;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

/** "09:30 AM", "10:30 AM" -> "09:30 - 10:30 AM" */
export function formatTimeRange(timeStart: string, timeEnd: string): string {
  const startMeridiem = timeStart.match(/\s*(AM|PM)$/i)?.[1];
  const endMeridiem = timeEnd.match(/\s*(AM|PM)$/i)?.[1];
  const start =
    startMeridiem && startMeridiem.toUpperCase() === endMeridiem?.toUpperCase()
      ? timeStart.replace(/\s*(AM|PM)$/i, '')
      : timeStart;
  return `${start} - ${timeEnd}`;
}

export function appointmentDay(appointment: Appointment): number {
  return dayTimestamp(parseISODate(appointment.date));
}

export function appointmentTimestamp(appointment: Appointment): number {
  const minutes = timeToMinutes(appointment.timeStart);
  return appointmentDay(appointment) + (Number.isFinite(minutes) ? minutes : 0) * 60000;
}

export function describeAppointment(appointment: Pick<Appointment, 'service' | 'date' | 'timeStart'>): string {
  return `${appointment.service} on ${formatDisplayDate(appointment.date)} at ${appointment.timeStart}`;
}