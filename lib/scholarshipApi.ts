import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// The UI components already define their own shapes (from your mock data),
// so these functions return the same shapes. `any` keeps them compatible.

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

/** timestamptz -> local "YYYY-MM-DD" (same format as toDateInputValue) */
function isoDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_FROM_DB: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

/* ---------------------------------------------------------------- */
/*  scholarships                                                     */
/* ---------------------------------------------------------------- */

export async function fetchScholarships(): Promise<any[]> {
  const { data, error } = await supabase
    .from('scholarships')
    .select('id, name, required_documents, data')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);

  // `data` holds every other field from your mock (description, deadline, slots...)
  return (data ?? []).map((s) => ({
    ...(s.data ?? {}),
    id: s.id,
    name: s.name,
    requiredDocuments: s.required_documents,
  }));
}

/* ---------------------------------------------------------------- */
/*  applications                                                     */
/* ---------------------------------------------------------------- */

const APPLICATION_COLUMNS =
  'id, application_id, scholarship_id, status, remarks, contact, gpa, document_files, created_at, scholarships(name)';

function mapApplication(a: any) {
  return {
    id: a.id,
    applicationId: a.application_id,
    scholarshipId: a.scholarship_id,
    scholarshipName: a.scholarships?.name ?? '',
    status: STATUS_FROM_DB[a.status] ?? 'Pending',
    remarks: a.remarks ?? '',
    dateSubmitted: isoDay(a.created_at),
    contact: a.contact,
    documents: (a.document_files ?? []).map((f: { name: string }) => f.name),
    ...(a.gpa ? { gpa: a.gpa } : {}),
  };
}

export async function fetchApplications(): Promise<any[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(APPLICATION_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapApplication);
}

/**
 * 1) upload each document to the private `scholarship-documents` bucket,
 * 2) insert the application. The database sets application_id, status and remarks.
 * draft = { scholarship, contact, gpa?, files: Record<documentName, File> }
 */
export async function submitApplication(draft: any): Promise<any> {
  const userId = await requireUserId();
  const applicationId = globalThis.crypto.randomUUID();

  const uploaded: string[] = [];
  const documentFiles: { label: string; name: string; path: string }[] = [];

  try {
    for (const [label, file] of Object.entries(draft.files ?? {})) {
      if (!(file instanceof File)) continue;
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const path = `${userId}/${applicationId}/${slug}-${safeName}`;

      const { error } = await supabase.storage.from('scholarship-documents').upload(path, file);
      if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`);

      uploaded.push(path);
      documentFiles.push({ label, name: file.name, path });
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        id: applicationId,
        scholarship_id: draft.scholarship.id,
        contact: draft.contact,
        gpa: draft.gpa ? String(draft.gpa) : null,
        document_files: documentFiles,
      })
      .select(APPLICATION_COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('You already applied for this scholarship.');
      throw new Error(error.message);
    }
    return mapApplication(data);
  } catch (err) {
    if (uploaded.length) await supabase.storage.from('scholarship-documents').remove(uploaded);
    throw err;
  }
}

/* ---------------------------------------------------------------- */
/*  notifications (module = 'scholarship')                           */
/* ---------------------------------------------------------------- */

export async function fetchNotifications(): Promise<any[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, is_read, created_at')
    .eq('module', 'scholarship')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title ?? 'Notification',
    message: n.message,
    date: isoDay(n.created_at),
    read: n.is_read,
  }));
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
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('module', 'scholarship');
  if (error) throw new Error(error.message);
}