import { createClient } from '@/utils/supabase/client';
import {
  listRegistrarRequests,
  listSubjectChanges,
  resolveSubjectChange,
  type StudentInfo,
} from './adminApi';

const supabase = createClient();

/* ---------------------------------------------------------------- */
/*  helpers                                                          */
/* ---------------------------------------------------------------- */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "BSCpE - 4B" */
function programYearSection(s: StudentInfo | null): string {
  if (!s) return '—';
  return [s.program, s.year_section].filter(Boolean).join(' - ') || '—';
}

/** Admin gives a reason + optional remarks; the database keeps one `remarks` column. */
const composeRemarks = (reason: string, remarks: string) =>
  [reason, remarks].map((x) => x?.trim()).filter(Boolean).join(' — ');

/* ---------------------------------------------------------------- */
/*  Add / Remove subject requests                                    */
/* ---------------------------------------------------------------- */

export async function fetchSubjectRequests(): Promise<any[]> {
  const rows = await listSubjectChanges(); // each row already has row.student
  if (!rows.length) return [];

  const codes = [...new Set(rows.map((r) => r.subject_code))];
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const [subjects, enrolled] = await Promise.all([
    supabase.from('subjects').select('code, units, day, time').in('code', codes),
    supabase.from('student_subjects').select('user_id, subjects(units)').eq('status', 'enrolled').in('user_id', userIds),
  ]);
  if (subjects.error) throw new Error(subjects.error.message);
  if (enrolled.error) throw new Error(enrolled.error.message);

  const catalog = new Map((subjects.data ?? []).map((s) => [s.code, s]));

  // current unit load per student
  const load = new Map<string, number>();
  for (const e of (enrolled.data ?? []) as any[]) {
    load.set(e.user_id, (load.get(e.user_id) ?? 0) + (e.subjects?.units ?? 0));
  }

  return rows.map((r: any) => {
    const course = catalog.get(r.subject_code);
    return {
      id: r.id,
      request_type: r.kind === 'add' ? 'Add Subject' : 'Remove Subject',
      course_code: r.subject_code,
      student_name: r.student?.full_name ?? 'Unknown student',
      program_year_section: programYearSection(r.student),
      created_at: r.created_at,
      status: cap(r.status), // Pending | Approved | Rejected
      student_number: r.student?.student_number ?? '—',
      course_name: r.subject_title,
      units: course?.units ?? 0,
      schedule: course ? `${course.day}  \u2022  ${course.time}` : '—',
      reason: r.reason,
      current_units: load.get(r.user_id) ?? 0,
    };
  });
}

/** Approving also adds/removes the subject in the student's enrollment (done inside the database). */
export const approveSubjectRequest = (id: string, remarks: string) =>
  resolveSubjectChange(id, true, remarks.trim() || undefined);

export const rejectSubjectRequest = (id: string, reason: string, remarks: string) =>
  resolveSubjectChange(id, false, composeRemarks(reason, remarks));

/* ---------------------------------------------------------------- */
/*  Document requests                                                */
/* ---------------------------------------------------------------- */

const CATEGORY_BY_TYPE: Record<string, string> = {
  report_of_grades: 'ROG',
  certificate_of_registration: 'COR',
  good_moral_certificate: 'Good Moral',
};

const CATEGORY_LABELS: Record<string, string> = {
  COR: 'Certificate of Registration',
  ROG: 'Report of Grades',
  'Good Moral': 'Good Moral Certificate',
  Other: 'Other Document Request',
};

export async function fetchDocumentRequests(): Promise<any[]> {
  const rows = await listRegistrarRequests();
  if (!rows.length) return [];

  // names of the admins who handled the requests
  const reviewerIds = [...new Set(rows.map((r: any) => r.handled_by).filter(Boolean))] as string[];
  const reviewers = new Map<string, string>();
  if (reviewerIds.length) {
    const { data } = await supabase.from('profiles').select('id, full_name').in('id', reviewerIds);
    for (const p of data ?? []) reviewers.set(p.id, p.full_name ?? 'Registrar Admin');
  }

  return rows.map((r: any) => {
    const category = CATEGORY_BY_TYPE[r.request_type] ?? 'Other';
    const done = r.status === 'approved' || r.status === 'ready';
    const status = r.status === 'rejected' ? 'Rejected' : done ? 'Approved' : 'Pending';

    // timeline built from the row (create a status-history table later for a full log)
    const history = [{ label: 'Request Submitted', at: r.created_at }];
    if (r.status === 'processing' && r.handled_at) history.push({ label: 'Under Review', at: r.handled_at });
    if (r.status !== 'pending' && r.status !== 'processing' && r.handled_at) {
      history.push({ label: r.status === 'ready' ? 'Ready for claiming' : status, at: r.handled_at });
    }

    return {
      id: r.id,
      request_type: CATEGORY_LABELS[category],
      category,
      student_name: r.student?.full_name ?? 'Unknown student',
      program_year_section: programYearSection(r.student),
      created_at: r.created_at,
      status,
      history,
      reason: r.status === 'rejected' ? r.remarks ?? undefined : undefined,
      reviewed_by: r.handled_by ? reviewers.get(r.handled_by) ?? 'Registrar Admin' : undefined,
    };
  });
}