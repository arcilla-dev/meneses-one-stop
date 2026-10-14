import { createBrowserClient } from "@supabase/ssr";
import type {
  Announcement,
  LSCNotification,
  PrintRequest,
  PrintRequestDraft,
  RequestStatus,
} from '@/lib/lscData';
import { toISODate } from '@/lib/lscUtils';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

/** Database statuses are lowercase; the UI uses these labels. */
const STATUS_FROM_DB: Record<string, string> = {
  pending: 'Pending',
  printing: 'Printing',
  ready: 'Ready for claiming',
  claimed: 'Claimed',
  cancelled: 'Cancelled',
};
const toStatus = (s: string) => (STATUS_FROM_DB[s] ?? 'Pending') as RequestStatus;

/** timestamptz -> local "YYYY-MM-DD" */
const isoDay = (iso: string) => toISODate(new Date(iso));

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

/* ---------------------------------------------------------------- */
/*  print requests                                                   */
/* ---------------------------------------------------------------- */

const REQUEST_COLUMNS =
  'id, request_number, file_names, paper_size, color, layout, pages, additional_request, total_bill, status, created_at, claimed_at';

function mapRequest(r: any): PrintRequest {
  return {
    id: r.id,
    requestNumber: r.request_number,
    fileNames: r.file_names,
    paperSize: r.paper_size,
    color: r.color,
    layout: r.layout,
    pages: r.pages,
    additionalRequest: r.additional_request ?? '',
    totalBill: Number(r.total_bill),
    status: toStatus(r.status),
    dateSubmitted: isoDay(r.created_at),
    claimedAt: r.claimed_at ? isoDay(r.claimed_at) : null,
  } as PrintRequest;
}

export async function fetchPrintRequests(): Promise<PrintRequest[]> {
  const { data, error } = await supabase
    .from('print_requests')
    .select(REQUEST_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRequest);
}

/**
 * 1) upload files to the private `print-files` bucket,
 * 2) insert the row. The database sets request_number, status, total_bill and created_at.
 */
export async function submitPrintRequest(draft: PrintRequestDraft): Promise<PrintRequest> {
  const userId = await requireUserId();
  const requestId = globalThis.crypto.randomUUID();

  const uploaded: string[] = [];
  try {
    for (const [i, file] of draft.files.entries()) {
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const path = `${userId}/${requestId}/${i + 1}-${safeName}`;
      const { error } = await supabase.storage.from('print-files').upload(path, file);
      if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`);
      uploaded.push(path);
    }

    const { data, error } = await supabase
      .from('print_requests')
      .insert({
        id: requestId,
        file_paths: uploaded,
        file_names: draft.files.map((f) => f.name),
        paper_size: String(draft.paperSize),
        color: String(draft.color),
        layout: String(draft.layout),
        pages: draft.pages,
        additional_request: draft.additionalRequest?.trim() || null,
      })
      .select(REQUEST_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    return mapRequest(data);
  } catch (err) {
    // don't leave orphaned files behind
    if (uploaded.length) await supabase.storage.from('print-files').remove(uploaded);
    throw err;
  }
}

/** Students can't edit rows directly; this only allows Pending -> Cancelled on their own request. */
export async function cancelPrintRequest(id: string) {
  const { error } = await supabase.rpc('cancel_print_request', { p_id: id });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  announcements                                                    */
/* ---------------------------------------------------------------- */

export async function fetchAnnouncements(): Promise<Announcement[]> {
  // RLS only returns this student's own read receipts, so a non-empty array means "read"
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, message, pinned, created_at, announcement_reads(user_id)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    pinned: a.pinned,
    date: isoDay(a.created_at),
    read: (a.announcement_reads?.length ?? 0) > 0,
  })) as Announcement[];
}

export async function markAnnouncementsRead(ids: string[]) {
  if (!ids.length) return;
  const userId = await requireUserId();
  const { error } = await supabase
    .from('announcement_reads')
    .upsert(
      ids.map((announcement_id) => ({ announcement_id, user_id: userId })),
      { onConflict: 'announcement_id,user_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- */
/*  notifications (module = 'lsc')                                   */
/* ---------------------------------------------------------------- */

export async function fetchNotifications(): Promise<LSCNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, is_read, created_at')
    .eq('module', 'lsc')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title ?? 'Notification',
    message: n.message,
    date: isoDay(n.created_at),
    read: n.is_read,
  })) as LSCNotification[];
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
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId).eq('module', 'lsc');
  if (error) throw new Error(error.message);
}