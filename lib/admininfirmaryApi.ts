import { createClient } from '@/utils/supabase/client';
import { listAppointments } from './adminApi';

const supabase = createClient();

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

/** "13:00:00" -> "01:00 PM" */
function to12h(t: string): string {
  const [hh, mm] = t.split(':');
  const h = Number(hh);
  return `${String(h % 12 || 12).padStart(2, '0')}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Service name -> filter tab */
function categoryOf(service: string): string {
  const s = service.toLowerCase();
  if (s.includes('consult')) return 'MedConsult';
  if (s.includes('vital')) return 'VSC';
  if (s.includes('dental')) return 'Dental';
  if (s.includes('certificate')) return 'MedCert';
  return 'Other';
}

function programYearSection(s: any): string {
  if (!s) return '—';
  return [s.program, s.year_section].filter(Boolean).join(' - ') || '—';
}

const composeRemarks = (reason: string, remarks: string) =>
  [reason, remarks].map((x) => x?.trim()).filter(Boolean).join(' — ');

/* ---------------------------------------------------------------- */
/*  Appointment requests (approve / reject)                          */
/* ---------------------------------------------------------------- */

export async function fetchAppointmentRequests(): Promise<any[]> {
  const rows = await listAppointments();

  return rows
    .filter((a: any) => a.status !== 'cancelled') // cancelled by the student, not a request decision
    .map((a: any) => ({
      id: a.id,
      service: a.service,
      category: categoryOf(a.service),
      student_name: a.student?.full_name ?? 'Unknown student',
      student_number: a.student?.student_number ?? '—',
      program_year_section: programYearSection(a.student),
      created_at: a.created_at,
      status: a.status === 'rejected' ? 'Rejected' : a.status === 'pending' ? 'Pending' : 'Approved',
      preferred_date: `${a.date}T00:00:00`,
      preferred_time: `${to12h(a.time_start)} - ${to12h(a.time_end)}`,
      reason: a.remarks || 'No remarks provided.', // the student's own remarks
    }));
}

/** Only a still-pending request can be decided, so two admins can't overwrite each other. */
async function decide(id: string, status: 'approved' | 'rejected', note: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status, admin_remarks: note || null })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    if (/exclusion|one_approved/i.test(error.message)) {
      throw new Error('Another appointment is already approved for that time. Reject this one or pick a different slot.');
    }
    throw new Error(error.message);
  }
  if (!data?.length) throw new Error('This request was already handled, or you do not have permission.');
}

export const approveAppointmentRequest = (id: string, remarks: string) => decide(id, 'approved', remarks.trim());
export const rejectAppointmentRequest = (id: string, reason: string, remarks: string) =>
  decide(id, 'rejected', composeRemarks(reason, remarks));

/* ---------------------------------------------------------------- */
/*  Appointments calendar                                            */
/* ---------------------------------------------------------------- */

export async function fetchScheduledAppointments(): Promise<any[]> {
  // Persist 'completed' for approved appointments whose time has passed (also runs on a schedule if pg_cron is on).
  // If the SQL hasn't been run yet this fails quietly and the page still derives Completed from the end time.
  const { error: completeError } = await supabase.rpc('complete_past_appointments');
  if (completeError) console.warn('complete_past_appointments:', completeError.message);

  const rows = await listAppointments();
  const now = new Date();

  return rows
    .filter((a: any) => ['approved', 'completed', 'cancelled'].includes(a.status))
    .map((a: any) => {
      const start = a.time_start.slice(0, 5);
      const end = a.time_end.slice(0, 5);
      let status = 'Scheduled';
      if (a.status === 'cancelled') status = 'Cancelled';
      else if (a.status === 'completed') status = 'Completed';
      else if (new Date(`${a.date}T${end}`) <= now) status = 'Completed'; // approved and already over

      return {
        id: a.id,
        date: a.date,
        start,
        end,
        service: a.service,
        student_name: a.student?.full_name ?? 'Unknown student',
        program_year_section: programYearSection(a.student),
        status,
      };
    });
}

/* ---------------------------------------------------------------- */
/*  Services                                                         */
/* ---------------------------------------------------------------- */

export async function fetchServices(): Promise<any[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, is_available')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

type ServiceValues = { name: string; description: string; is_available: boolean };

export async function createService(values: ServiceValues): Promise<any> {
  const { data, error } = await supabase
    .from('services')
    .insert(values)
    .select('id, name, description, is_available')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('A service with that name already exists.');
    throw new Error(error.message);
  }
  return data;
}

export async function updateService(id: string, values: ServiceValues): Promise<void> {
  const { data, error } = await supabase.from('services').update(values).eq('id', id).select('id');
  if (error) {
    if (error.code === '23505') throw new Error('A service with that name already exists.');
    throw new Error(error.message);
  }
  if (!data?.length) throw new Error('Nothing was updated. You may not have permission.');
}