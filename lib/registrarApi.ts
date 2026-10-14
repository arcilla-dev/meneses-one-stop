import { createBrowserClient } from "@supabase/ssr"; // <- point this at YOUR existing Supabase client
import type { FormValues, RequestFormConfig, Subject, SubjectChangeKind } from './requestForms';
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

/* ---------------------------------------------------------------- */
/*  subjects                                                         */
/* ---------------------------------------------------------------- */

type SubjectRow = { code: string; title: string; units: number; day: string; time: string };

/** Subjects the student is currently enrolled in. */
export async function fetchCurrentSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('student_subjects')
    .select('subjects(code, title, units, day, time)')
    .eq('status', 'enrolled');
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row: any) => row.subjects as SubjectRow | null)
    .filter((s): s is SubjectRow => !!s);
}

/** Catalog subjects the student is NOT already enrolled in. */
export async function fetchAvailableSubjects(): Promise<Subject[]> {
  const [all, current] = await Promise.all([
    supabase.from('subjects').select('code, title, units, day, time').order('code'),
    fetchCurrentSubjects(),
  ]);
  if (all.error) throw new Error(all.error.message);

  const taken = new Set(current.map((s) => s.code));
  return (all.data ?? []).filter((s) => !taken.has(s.code));
}

/* ---------------------------------------------------------------- */
/*  document requests                                                */
/* ---------------------------------------------------------------- */

export async function submitDocumentRequest(values: FormValues, config: RequestFormConfig) {
  const userId = await requireUserId();

  // block duplicate open requests (except "other")
  if (config.requestType !== 'other') {
    const { count, error } = await supabase
      .from('registrar_requests')
      .select('id', { count: 'exact', head: true })
      .eq('request_type', config.requestType)
      .in('status', ['pending', 'processing']);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) throw new Error(`You already have a ${config.title} request in progress.`);
  }

  // a File can't go in a column: upload it, keep only the path
  let attachmentPath: string | null = null;
  const details: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value instanceof File) {
      const safeName = value.name.replace(/[^\w.-]/g, '_');
      const path = `${userId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('request-attachments').upload(path, value);
      if (error) throw new Error('File upload failed: ' + error.message);
      attachmentPath = path;
    } else if (typeof value === 'string' && value !== '') {
      details[key] = value;
    }
  }

  const { error } = await supabase.from('registrar_requests').insert({
    request_type: config.requestType,
    details,
    attachment_path: attachmentPath,
  });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  add / remove subject                                             */
/* ---------------------------------------------------------------- */

export async function submitSubjectChange(kind: SubjectChangeKind, subject: Subject, reason: string) {
  await requireUserId();
  const { error } = await supabase.from('subject_changes').insert({
    kind,
    subject_code: subject.code,
    subject_title: subject.title,
    reason,
  });
  if (error) {
    // unique index: one pending change per subject
    if (error.code === '23505') throw new Error(`You already have a pending request for ${subject.code}.`);
    throw new Error(error.message);
  }
}

/** Pending add/remove requests for the "pending requests" panel. */
export async function fetchPendingSubjectChanges() {
  const { data, error } = await supabase
    .from('subject_changes')
    .select('id, kind, subject_code, subject_title, reason, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Pending document requests (e.g. for the Overview counts). */
export async function fetchDocumentRequests() {
  const { data, error } = await supabase
    .from('registrar_requests')
    .select('id, request_type, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ---------------------------------------------------------------- */
/*  notifications                                                    */
/* ---------------------------------------------------------------- */

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, is_read, created_at')
    .eq('module', 'registrar') 
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('module', 'registrar') 
  .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function clearNotifications() {
  const userId = await requireUserId();
  const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('user_id', userId)
  .eq('module', 'registrar');
  if (error) throw new Error(error.message);
}