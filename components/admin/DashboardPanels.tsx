"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Megaphone, Pencil, Settings } from "lucide-react";
import type { Column, Row, Status, QuickAction } from "@/lib/adminDashboard";

const statusStyle: Record<Status, string> = {
  Pending: "bg-[#ffe55c] text-[#4a3b00]",
  Approved: "bg-[#7ed957] text-[#143d00]",
  Processed: "bg-[#7ed957] text-[#143d00]",
  Rejected: "bg-[#ff3b3b] text-white",
};

const tab =
  "absolute -top-4 left-4 rounded-md border-2 border-[#8d5c88] bg-[#b3789f] px-5 py-1.5 " +
  "text-lg font-bold tracking-wide text-white shadow";

/* ---------------- Recent requests ---------------- */

export function RecentRequests({
  columns,
  rows,
  href,
}: {
  columns: Column[];
  rows: Row[];
  href: string;
}) {
  const router = useRouter();

  return (
    <section className="relative rounded-xl bg-[#c897b9] p-4 pt-10 shadow-md">
      <h2 className={tab}>Recent Requests</h2>
      <Link
        href={href}
        className="absolute right-4 top-3 text-sm font-bold text-[#4b2a5a] underline underline-offset-2 hover:text-[#2b0914]"
      >
        View all
      </Link>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[3px] text-sm" style={{ fontFamily: "Georgia, serif" }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="bg-[#b3789f] px-3 py-2 font-bold text-white">
                  {c.label}
                </th>
              ))}
              <th className="bg-[#b3789f] px-3 py-2 font-bold text-white">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                tabIndex={0}
                role="link"
                onClick={() => router.push(`${href}/${r.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`${href}/${r.id}`)}
                className="cursor-pointer bg-[#f4d3e8] transition-colors hover:bg-[#fbe6f2] focus-visible:outline-2 focus-visible:outline-[#6b4f72]"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 text-black ${c.align === "left" ? "text-left" : "text-center"}`}
                  >
                    {r[c.key]}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  <span className={`inline-block min-w-24 rounded-full px-3 py-0.5 text-xs font-bold ${statusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="bg-[#f4d3e8] px-3 py-6 text-center text-[#6b4f72]">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------- Announcements ---------------- */

export type Announcement = { id: string; title: string; body: string; date: string };

export function AnnouncementsPanel({
  items,
  manageHref,
}: {
  items: Announcement[];
  manageHref: string;
}) {
  return (
    <section className="relative flex-1 rounded-xl border-2 border-[#8d5c88] bg-[#f4d3e8] p-4 pt-9 shadow-md">
      <h2 className={`${tab} left-1/2 -translate-x-1/2`}>Announcements</h2>

      <Link
        href={manageHref}
        className="mb-3 flex items-center gap-2 rounded-md border border-[#c897b9] bg-[#fbe6f2] px-3 py-2 text-xs font-bold text-[#6b4f72] hover:bg-white"
      >
        <Megaphone className="h-4 w-4" /> Make new announcement…
      </Link>

      <ul className="flex flex-col gap-2">
        {items.map((a) => (
          <li key={a.id} className="relative flex items-center gap-3 rounded-lg bg-[#c897b9] px-3 py-2">
            <Settings className="h-8 w-8 shrink-0 text-[#543b59]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{a.title}</p>
              <p className="truncate text-xs text-[#2b0914]">{a.body}</p>
            </div>
            <span className="self-end text-[10px] text-white">{a.date}</span>
            <Link href={`${manageHref}/${a.id}`} aria-label={`Edit ${a.title}`} className="absolute right-2 top-1.5 text-white hover:text-[#2b0914]">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-lg bg-[#c897b9] px-3 py-4 text-center text-sm text-white">
            No announcements yet. Post the first one.
          </li>
        )}
      </ul>
    </section>
  );
}

/* ---------------- Quick actions ---------------- */

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <aside className="w-full rounded-lg bg-[#b3789f] p-4 shadow-md lg:w-[230px] lg:self-start">
      <h2 className="mb-3 text-sm font-bold text-white">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="rounded-md bg-[#d9a9c9] px-3 py-1.5 text-xs font-bold text-[#3b2442] shadow-sm hover:bg-[#ecc3de]"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
