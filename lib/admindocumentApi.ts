import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

/**
 * Approve or reject a document request (registrar_requests).
 * Only works while it still shows as Pending in the admin UI ('pending' or 'processing'),
 * so two admins can't overwrite each other. The database trigger notifies the student.
 */
export async function decideDocumentRequest(
  id: string,
  approve: boolean,
  reason: string,   
  remarks: string
): Promise<void> {
  const note = [reason, remarks].filter(Boolean).join(" \u2014 "); // "Reason — remarks"

  const { data, error } = await supabase
    .from("registrar_requests")
    .update({ status: approve ? "approved" : "rejected", remarks: note || null })
    .eq("id", id)
    .in("status", ["pending", "processing"])
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("This request was already handled, or your account isn't staff. Reload the page.");
  }
}