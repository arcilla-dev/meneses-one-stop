"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Announcement } from "@/components/admin/DashboardPanels";

const supabase = createClient();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Latest announcements issued by one office.
 * `announcements.office` is stamped by the database from profiles.office, so it is matched with ILIKE
 * ("registrar" matches "Registrar" and "Registrar Office"). ASSUMPTION: the stored value contains the office key.
 * That may not hold for offices whose key differs from their display name (e.g. "lsc").
 */
export function useOfficeAnnouncements(office: string | undefined, limit = 5) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!office) return;
    let cancelled = false;
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, message, created_at")
        .ilike("office", `%${office}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (error) {
        console.error(error.message);
        setError("Could not load announcements.");
        return;
      }
      setItems(
        (data ?? []).map((a: any) => ({
          id: String(a.id),
          title: a.title ?? "Untitled",
          body: a.message ?? "",
          date: fmtDate(a.created_at),
        }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [office, limit]);

  return { items, error };
}
