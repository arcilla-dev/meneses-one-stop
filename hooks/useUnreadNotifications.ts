"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Role } from "@/contexts/UserProfileContext";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  CONFIRM THESE AGAINST YOUR TABLES                                  */
/*  readColumn = the boolean column that flips to true once read.      */
/* ------------------------------------------------------------------ */
const STUDENT_SOURCE = { table: "notifications", readColumn: "is_read", ownerColumn: "user_id" };
// RLS (staff_can_see_module) already limits which rows a staff member can see.
const STAFF_SOURCE = { table: "admin_notifications", readColumn: "is_read", ownerColumn: null };

/** Number of unread notifications for the signed-in user (student or staff). */
export function useUnreadNotifications(role: Role): number {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const source = role === "student" ? STUDENT_SOURCE : STAFF_SOURCE;

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }

    // `not is true` counts both false and null as unread
    let query = supabase
      .from(source.table)
      .select("*", { count: "exact", head: true })
      .not(source.readColumn, "is", true);
    if (source.ownerColumn) query = query.eq(source.ownerColumn, user.id);

    const { count: total, error } = await query;
    if (error) {
      console.error(`Unread count (${source.table}):`, error.message);
      return;
    }
    setCount(total ?? 0);
  }, [source]);

  // Load on mount and whenever the page changes (e.g. after visiting Notifications)
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  // Stay current: live changes (needs Realtime enabled on the table) + tab focus
  useEffect(() => {
    const channel = supabase
      .channel(`unread-${source.table}`)
      .on("postgres_changes", { event: "*", schema: "public", table: source.table }, () => refresh())
      .subscribe();

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [source, refresh]);

  return count;
}
