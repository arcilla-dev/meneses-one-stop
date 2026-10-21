"use client";

import { useSearchParams } from "next/navigation";

/** The header search text (?q=...), trimmed and lowercased. Empty string when there is none. */
export function useSearchQuery(): string {
  return (useSearchParams().get("q") ?? "").trim().toLowerCase();
}

/** True when there is no query, or any of the fields contains it. */
export function matchesQuery(q: string, ...fields: Array<string | null | undefined>): boolean {
  return !q || fields.some((f) => (f ?? "").toLowerCase().includes(q));
}