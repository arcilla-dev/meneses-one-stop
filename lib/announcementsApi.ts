import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export interface AnnouncementItem {
  id: string; // uuid
  title: string;
  message: string;
  created_at: string; // ISO timestamp, set by the database
  announcement_type: string; // used to pick an icon
  office: string; // issuing office, set by the database from profiles.office
}

export interface AnnouncementInput {
  title: string;
  message: string;
  announcement_type: string;
}

// Keep in sync with the "Staff edit announcements within 1 hour" policy in supabase/admin-announcements.sql.
// The database is the real enforcer; this only decides whether the edit button is shown.
export const EDIT_WINDOW_MS = 60 * 60 * 1000;

export const DEFAULT_OFFICE = "Administration";

const COLUMNS = "id, title, message, created_at, announcement_type, office";

// RLS and missing grants both surface as 42501; give the person something readable.
const toError = (error: { code?: string; message: string }) =>
  new Error(
    error.code === "42501"
      ? "Your account isn't allowed to do that. Only staff accounts can manage announcements."
      : error.message
  );

/** Everyone who is signed in (students and admins) can read all announcements. */
export async function fetchAnnouncements(): Promise<AnnouncementItem[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw toError(error);
  return (data ?? []) as AnnouncementItem[];
}

/** The office the signed-in admin posts for (profiles.office). The database stamps the same value on insert. */
export async function fetchMyOffice(): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return DEFAULT_OFFICE;

  const { data, error } = await supabase
    .from("profiles")
    .select("office")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) throw toError(error);
  return data?.office?.trim() || DEFAULT_OFFICE;
}

/** Staff only. created_at, created_by and office are set by the database. */
export async function createAnnouncement(input: AnnouncementInput): Promise<AnnouncementItem> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: input.title,
      message: input.message,
      announcement_type: input.announcement_type,
    })
    .select(COLUMNS)
    .single();
  if (error) throw toError(error);
  return data as AnnouncementItem;
}

/** Staff only, and only within 1 hour of posting. */
export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<AnnouncementItem> {
  const { data, error } = await supabase
    .from("announcements")
    .update({
      title: input.title,
      message: input.message,
      announcement_type: input.announcement_type,
    })
    .eq("id", id)
    .select(COLUMNS);
  if (error) throw toError(error);

  // RLS doesn't raise an error for rows it hides: it just updates nothing.
  if (!data || data.length === 0) {
    throw new Error(
      "Nothing was updated. The 1-hour edit window has probably ended, or the announcement was already deleted."
    );
  }
  return data[0] as AnnouncementItem;
}

/** Staff only. Removes the announcement for every user. */
export async function deleteAnnouncement(id: string): Promise<void> {
  const { data, error } = await supabase.from("announcements").delete().eq("id", id).select("id");
  if (error) throw toError(error);
  if (!data || data.length === 0) {
    throw new Error("Nothing was deleted. It may already be gone, or this account isn't staff.");
  }
}
