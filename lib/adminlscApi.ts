import { createClient } from "@/utils/supabase/client";
import type {
  PaperSize,
  PrintColor,
  PrintRequestDetails,
  PrintStatus,
} from "@/components/admin/lsc/modals/PrintingModals";

const supabase = createClient();

const BUCKET = "print-files";

/**
 * What the admin "Process" button sets in the database.
 * 'printing' = the student is told it is being printed; use 'ready' to tell them it can be claimed.
 */
export const PROCESS_TO: "printing" | "ready" = "printing";

export interface PrintRequest extends PrintRequestDetails {
  created_at: string;
  request_number: string;
  remarks: string;
}

export interface LscService {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceValues {
  name: string;
  description: string;
  is_active: boolean;
}

const fail = (message: string): never => {
  throw new Error(message);
};

/* ------------------------------ Print requests ----------------------------- */

// Database status -> admin UI status. 'cancelled' (student cancelled) is not shown at all.
const STATUS_FROM_DB: Record<string, PrintStatus> = {
  pending: "Pending",
  printing: "Processed",
  ready: "Processed",
  claimed: "Processed",
  rejected: "Rejected",
};

// The form stores lowercase values (see lsc_rates); the UI shows these labels.
const PAPER_FROM_DB: Record<string, PaperSize> = {
  letter: "Letter",
  a4: "A4",
  legal: "Legal",
};
const COLOR_FROM_DB: Record<string, PrintColor> = {
  colored: "Colored",
  color: "Colored",
  bw: "B&W",
  "black & white": "B&W",
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export async function fetchPrintRequests(): Promise<PrintRequest[]> {
  const { data, error } = await supabase
    .from("print_requests")
    .select(
      "id, user_id, request_number, file_paths, file_names, paper_size, color, layout, pages, additional_request, total_bill, status, remarks, created_at"
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) fail(error.message);

  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  // Student info (print_requests.user_id points to auth.users, so profiles are looked up separately).
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
  const paths = rows.flatMap((r) => r.file_paths ?? []).filter(Boolean);
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
    const paper = String(r.paper_size ?? "");
    const color = String(r.color ?? "");
    const item = {
      id: r.id,
      request_number: r.request_number,
      status: STATUS_FROM_DB[r.status] ?? "Pending",
      student_name: student?.full_name || profile?.full_name || "Unknown student",
      student_number: student?.student_number ?? "",
      program_year_section: [student?.program, student?.year_section].filter(Boolean).join(" - "),
      paper_size: PAPER_FROM_DB[paper.toLowerCase()] ?? paper,
      color: COLOR_FROM_DB[color.toLowerCase()] ?? color,
      layout: capitalize(String(r.layout ?? "")),
      pages: r.pages,
      additional_request: r.additional_request ?? "",
      attachments: (r.file_paths ?? []).map((path: string, i: number) => ({
        name: r.file_names?.[i] ?? path.split("/").pop(),
        url: urlByPath.get(path) ?? "#",
      })),
      total: Number(r.total_bill ?? 0),
      remarks: r.remarks ?? "",
      created_at: r.created_at,
    };
    return item as unknown as PrintRequest;
  });
}

/** Process or reject. Only works while the request is still pending. */
export async function decidePrintRequest(
  id: string | number,
  action: "process" | "reject",
  remarks: string
): Promise<void> {
  const { data, error } = await supabase
    .from("print_requests")
    .update({ status: action === "process" ? PROCESS_TO : "rejected", remarks })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) fail(error.message);
  if (!data || data.length === 0) {
    fail("This request was already handled, or your account isn't staff. Reload the page.");
  }
}

/* -------------------------------- Services --------------------------------- */

const DUPLICATE = "A service with that name already exists.";

export async function fetchLscServices(): Promise<LscService[]> {
  const { data, error } = await supabase
    .from("lsc_services")
    .select("id, name, description, is_active, created_at")
    .order("created_at", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []) as LscService[];
}

/** Creates a service, or updates it when `id` is given. */
export async function saveLscService(values: ServiceValues, id?: string | number): Promise<LscService> {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim(),
    is_active: values.is_active,
  };

  if (id !== undefined) {
    const { data, error } = await supabase
      .from("lsc_services")
      .update(payload)
      .eq("id", id)
      .select("id, name, description, is_active, created_at");
    if (error) fail(error.code === "23505" ? DUPLICATE : error.message);
    if (!data || data.length === 0) fail("Nothing was updated. Is this account staff?");
    return data![0] as LscService;
  }

  const { data, error } = await supabase
    .from("lsc_services")
    .insert(payload)
    .select("id, name, description, is_active, created_at")
    .single();
  if (error) fail(error.code === "23505" ? DUPLICATE : error.message);
  return data as LscService;
}