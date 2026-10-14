import { createClient } from '@/utils/supabase/client';

// Uses the normal browser client. Admin power comes from RLS policies that check
// public.is_staff(), NOT from the service-role key (never put that in a client component).
const supabase = createClient();

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

export interface StudentInfo {
  id: string;
  full_name: string | null;
  email: string | null;
  student_number: string | null;
  program: string | null;
  year_section: string | null;
  phone: string | null;
}

/** Attach the student's name / number / program to each row (rows need a `user_id`). */
async function withStudents<T extends { user_id: string }>(rows: T[]): Promise<(T & { student: StudentInfo | null })[]> {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (!ids.length) return rows.map((r) => ({ ...r, student: null }));

  const [profiles, students] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', ids),
    supabase.from('student_profiles').select('id, full_name, student_number, program, year_section, phone').in('id', ids),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);
  if (students.error) throw new Error(students.error.message);

  const byId = new Map<string, StudentInfo>();
  for (const p of profiles.data ?? []) {
    byId.set(p.id, { id: p.id, full_name: p.full_name, email: p.email, student_number: null, program: null, year_section: null, phone: null });
  }
  for (const s of students.data ?? []) {
    const base = byId.get(s.id);
    if (base) {
      const { full_name, ...rest } = s;
      Object.assign(base, rest);
      if (full_name) base.full_name = full_name; // student_profiles.full_name wins, like on the student pages
    }
  }
  return rows.map((r) => ({ ...r, student: byId.get(r.user_id) ?? null }));
}

async function list(table: string, status?: string) {
  let q = supabase.from(table).select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return withStudents((data ?? []) as any[]);
}

/** RLS blocks non-staff silently (0 rows), so check that a row really changed. */
async function setStatus(table: string, id: string, status: string, remarks?: string, remarksColumn = 'remarks') {
  const patch: Record<string, unknown> = { status };
  if (remarks !== undefined) patch[remarksColumn] = remarks;

  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select('id');
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error('Nothing was updated. You may not have permission, or the row no longer exists.');
}

/** Short-lived link so staff can open a student's uploaded file. */
export async function getFileUrl(bucket: 'request-attachments' | 'print-files' | 'scholarship-documents', path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/* ---------------------------------------------------------------- */
/*  registrar                                                        */
/* ---------------------------------------------------------------- */

export type RegistrarStatus = 'pending' | 'processing' | 'ready' | 'rejected';

export const listRegistrarRequests = (status?: RegistrarStatus) => list('registrar_requests', status);
export const setRegistrarStatus = (id: string, status: RegistrarStatus, remarks?: string) =>
  setStatus('registrar_requests', id, status, remarks);

export const listSubjectChanges = (status?: 'pending' | 'approved' | 'rejected') => list('subject_changes', status);

/** Approve or reject an add/remove subject request. Approving also updates the student's enrolled subjects. */
export async function resolveSubjectChange(id: string, approve: boolean, remarks?: string) {
  const { error } = await supabase.rpc('resolve_subject_change', { p_id: id, p_approve: approve, p_remarks: remarks ?? null });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  infirmary                                                        */
/* ---------------------------------------------------------------- */

export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export const listAppointments = (status?: AppointmentStatus) => list('appointments', status);
export const setAppointmentStatus = (id: string, status: AppointmentStatus, remarks?: string) =>
  setStatus('appointments', id, status, remarks, 'admin_remarks');

/* ---------------------------------------------------------------- */
/*  LSC                                                              */
/* ---------------------------------------------------------------- */

export type PrintStatus = 'pending' | 'printing' | 'ready' | 'claimed' | 'cancelled';

export const listPrintRequests = (status?: PrintStatus) => list('print_requests', status);
export const setPrintStatus = (id: string, status: PrintStatus) => setStatus('print_requests', id, status);

export async function createAnnouncement(a: { title: string; message: string; pinned?: boolean }) {
  const { error } = await supabase.from('announcements').insert({ title: a.title, message: a.message, pinned: a.pinned ?? false });
  if (error) throw new Error(error.message);
}
export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  scholarship                                                      */
/* ---------------------------------------------------------------- */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export const listApplications = (status?: ApplicationStatus) => list('applications', status);
export const setApplicationStatus = (id: string, status: ApplicationStatus, remarks?: string) =>
  setStatus('applications', id, status, remarks);