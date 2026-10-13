import { createClient } from '@/utils/supabase/client';
import type { Appointment, AppointmentDraft, AppointmentStatus, InfirmaryNotification } from '@/lib/infirmaryData';
import { formatDisplayDate } from '@/lib/infirmaryUtils';

const supabase = createClient();

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

/** "09:30 AM" -> "09:30:00" (Postgres `time`) */
function to24h(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) throw new Error(`Invalid time: ${t}`);
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}:00`;
}

/** "13:30:00" -> "01:30 PM" */
function to12h(t: string): string {
  const [hh, mm] = t.split(':');
  const h = Number(hh);
  return `${String(h % 12 || 12).padStart(2, '0')}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** timestamptz string -> local "YYYY-MM-DD" (so Philippine time doesn't shift the day) */
function localISODate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'pending' -> 'Pending' (the UI uses capitalized statuses) */
const toStatus = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)) as AppointmentStatus;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

/* ---------------------------------------------------------------- */
/*  appointments                                                     */
/* ---------------------------------------------------------------- */

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, service, date, time_start, time_end, status, remarks, created_at')
    .order('date', { ascending: false })
    .order('time_start', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((a) => ({
    id: a.id,
    service: a.service,
    date: a.date, // already ISO YYYY-MM-DD
    timeStart: to12h(a.time_start),
    timeEnd: to12h(a.time_end),
    status: toStatus(a.status),
    remarks: a.remarks ?? '',
    dateSubmitted: formatDisplayDate(localISODate(a.created_at)),
  })) as Appointment[];
}

export async function submitAppointment(draft: AppointmentDraft) {
  await requireUserId();

  // user_id, id, status and created_at are filled in by the database
  const { error } = await supabase.from('appointments').insert({
    service: draft.service,
    date: draft.date,
    time_start: to24h(draft.timeStart),
    time_end: to24h(draft.timeEnd),
    remarks: draft.remarks?.trim() || null,
  });

  if (error) {
    if (error.code === '23P01') throw new Error('You already have an appointment that overlaps this time.');
    if (error.code === '23514') throw new Error('The end time must be after the start time.');
    throw new Error(error.message);
  }
}

/** Students can't edit rows directly; this function only allows Pending/Approved -> Cancelled on their own row. */
export async function cancelAppointment(id: string) {
  const { error } = await supabase.rpc('cancel_appointment', { p_id: id });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  notifications (module = 'infirmary')                             */
/* ---------------------------------------------------------------- */

export async function fetchNotifications(): Promise<InfirmaryNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, is_read, type, created_at')
    .eq('module', 'infirmary')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((n) => ({
    id: n.id,
    message: n.message,
    date: formatDisplayDate(localISODate(n.created_at)),
    read: n.is_read,
    type: n.type ?? 'appointment',
  })) as InfirmaryNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function clearNotifications() {
  const userId = await requireUserId();
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId).eq('module', 'infirmary');
  if (error) throw new Error(error.message);
}