import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export interface Attachment {
  name: string;
  url: string;
}

export interface ScholarshipApplication {
  id: string;
  application_id: string; // e.g. SCH-2026-00001
  scholarship: string;
  student_name: string;
  student_number: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string;
  status: ApplicationStatus;
  gpa: string;
  remarks: string;
  attachments: Attachment[];
}

export interface ProgramValues {
  name: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  period_start: string;
  period_end: string;
  required_documents: string[];
  is_active: boolean;
}

export interface Program extends ProgramValues {
  id: string;
}

const BUCKET = "scholarship-documents";

const capitalize = (s: string): ApplicationStatus =>
  (s.charAt(0).toUpperCase() + s.slice(1)) as ApplicationStatus;

const fail = (message: string): never => {
  throw new Error(message);
};

/* ------------------------------ Applications ------------------------------ */

export async function fetchApplications(): Promise<ScholarshipApplication[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, application_id, user_id, gpa, document_files, status, remarks, created_at, scholarships(name)"
    )
    .order("created_at", { ascending: false });
  if (error) fail(error.message);

  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  // Student info (applications.user_id points to auth.users, so we look up profiles separately).
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [spRes, pRes] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("id, full_name, student_number, program, year_section")
      .in("id", userIds),
    supabase.from("profiles").select("id, full_name").in("id", userIds),
  ]);
  if (spRes.error) fail(spRes.error.message);
  if (pRes.error) fail(pRes.error.message);

  const sp = new Map((spRes.data ?? []).map((s: any) => [s.id, s]));
  const pr = new Map((pRes.data ?? []).map((p: any) => [p.id, p]));

  // One batch of signed URLs for every uploaded file.
  const paths = rows.flatMap((r) => (r.document_files ?? []).map((f: any) => f.path)).filter(Boolean);
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    });
  }

  return rows.map((r) => {
    const student: any = sp.get(r.user_id);
    const profile: any = pr.get(r.user_id);
    const scholarship = Array.isArray(r.scholarships) ? r.scholarships[0] : r.scholarships;
    return {
      id: r.id,
      application_id: r.application_id,
      scholarship: scholarship?.name ?? "Unknown scholarship",
      student_name: student?.full_name || profile?.full_name || "Unknown student",
      student_number: student?.student_number ?? "",
      program_year_section: [student?.program, student?.year_section].filter(Boolean).join(" - "),
      created_at: r.created_at,
      status: capitalize(r.status),
      gpa: r.gpa ?? "",
      remarks: r.remarks ?? "",
      attachments: (r.document_files ?? []).map((f: any) => ({
        name: f.label ? `${f.label}: ${f.name}` : f.name,
        url: urlByPath.get(f.path) ?? "#",
      })),
    };
  });
}

/** Approve or reject. Only works while the application is still pending. */
export async function decideApplication(
  id: string,
  status: "Approved" | "Rejected",
  remarks: string
): Promise<void> {
  const { data, error } = await supabase
    .from("applications")
    .update({ status: status.toLowerCase(), remarks })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) fail(error.message);
  if (!data || data.length === 0) {
    fail("This application was already handled, or your account isn't staff. Reload the page.");
  }
}

/* -------------------------------- Programs -------------------------------- */

const toProgram = (r: any): Program => {
  const d = r.data ?? {};
  return {
    id: r.id,
    name: r.name,
    description: d.description ?? "",
    eligibility: d.eligibility ?? [],
    benefits: d.benefits ?? [],
    period_start: d.applicationStart ?? d.period_start ?? "",
    period_end: d.applicationEnd ?? d.period_end ?? "",
    required_documents: r.required_documents ?? [],
    is_active: r.is_active,
  };
};

export async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from("scholarships")
    .select("id, name, required_documents, data, is_active")
    .order("created_at", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map(toProgram);
}

/**
 * Builds the `data` jsonb the student side reads (see the Scholarship type in lib/scholarshipData.ts).
 * Keys the form doesn't edit (about, requiresGpa, maxGpa) are kept from the existing row,
 * or given safe defaults for a new program.
 */
const toStudentData = (v: ProgramValues, existing: Record<string, any> = {}) => {
  // drop the old admin-only keys from earlier saves
  const { period_start: _s, period_end: _e, ...rest } = existing;
  return {
    about: v.description,
    requiresGpa: false,
    maxGpa: null,
    ...rest,
    description: v.description,
    eligibility: v.eligibility,
    benefits: v.benefits,
    applicationStart: v.period_start,
    applicationEnd: v.period_end,
    deadline: v.period_end,
    status: v.is_active ? "Open" : "Closed",
  };
};

/** Creates a program, or updates it when `id` is given. */
export async function saveProgram(values: ProgramValues, id?: string): Promise<Program> {
  const { name, required_documents, is_active } = values;

  if (id) {
    const { data: existing, error: readErr } = await supabase
      .from("scholarships")
      .select("data")
      .eq("id", id)
      .single();
    if (readErr) fail(readErr.message);

    const { data, error } = await supabase
      .from("scholarships")
      .update({
        name,
        required_documents,
        is_active,
        data: toStudentData(values, existing?.data ?? {}),
      })
      .eq("id", id)
      .select("id, name, required_documents, data, is_active");
    if (error) fail(error.message);
    if (!data || data.length === 0) fail("Nothing was updated. Is this account staff?");
    return toProgram(data![0]);
  }

  const { data, error } = await supabase
    .from("scholarships")
    .insert({ name, required_documents, is_active, data: toStudentData(values) })
    .select("id, name, required_documents, data, is_active")
    .single();
  if (error) fail(error.message);
  return toProgram(data);
}