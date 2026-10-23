"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  HeartPulse,
  Megaphone,
  PlusSquare,
  RefreshCw,
  Search,
  Smile,
  Stethoscope,
} from "lucide-react";
// ASSUMPTION: this lives in "@/lib". Adjust if your folder differs.
import { fetchAppointmentRequests } from "@/lib/admininfirmaryApi";

/** Every request on the dashboard opens this page. */
export const INFIRMARY_REQUESTS_HREF = "/adminv2/infirmary/appointment-requests";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = "Pending" | "Approved" | "Rejected";
export type AppointmentCategory = "MedConsult" | "VSC" | "Dental" | "MedCert" | "Other";

export interface InfirmaryRow {
  id: string;
  service: string;
  category: AppointmentCategory;
  student_name: string;
  student_number: string;
  program_year_section: string;
  created_at: string;
  status: AppointmentStatus; // note: the API maps both 'approved' and 'completed' to "Approved"
  preferred_date: string; // ISO, midnight
  preferred_time: string; // "01:00 PM - 02:00 PM"
  reason: string;
}

export interface InfirmaryFilters {
  status: "All" | AppointmentStatus;
  category: "All" | AppointmentCategory;
  query: string;
}

export const INFIRMARY_DEFAULT_FILTERS: InfirmaryFilters = { status: "All", category: "All", query: "" };

const CATEGORY_LABELS: Record<AppointmentCategory, string> = {
  MedConsult: "Consultation",
  VSC: "Vital Signs",
  Dental: "Dental",
  MedCert: "Med Certificate",
  Other: "Other",
};

const CATEGORY_ICONS: Record<AppointmentCategory, React.ElementType> = {
  MedConsult: Stethoscope,
  VSC: HeartPulse,
  Dental: Smile,
  MedCert: FileText,
  Other: PlusSquare,
};

/* ------------------------------------------------------------------ */
/*  Data loading                                                       */
/* ------------------------------------------------------------------ */

/** Never throws: a failure comes back in `errors` so the page can show it. */
export async function loadInfirmaryRows(): Promise<{ rows: InfirmaryRow[]; errors: string[] }> {
  try {
    const data = (await fetchAppointmentRequests()) as InfirmaryRow[];
    const rows = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { rows, errors: [] };
  } catch (e: any) {
    return { rows: [], errors: [`Appointment requests: ${e?.message ?? "failed to load"}`] };
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  Pending: "bg-amber-100 text-amber-900 border-amber-300",
  Approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Rejected: "bg-rose-100 text-rose-900 border-rose-300",
};

const serif = { fontFamily: "Georgia, serif" } as const;
const PAGE_SIZE = 8;

/* ------------------------------------------------------------------ */
/*  Request list                                                       */
/* ------------------------------------------------------------------ */

export function InfirmaryRequests({
  rows,
  loading,
  warnings,
  filters,
  onFiltersChange,
}: {
  rows: InfirmaryRow[];
  loading: boolean;
  warnings: string[];
  filters: InfirmaryFilters;
  onFiltersChange: (f: InfirmaryFilters) => void;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filters.status === "All" || r.status === filters.status) &&
        (filters.category === "All" || r.category === filters.category) &&
        (!q || r.student_name.toLowerCase().includes(q) || r.service.toLowerCase().includes(q))
    );
  }, [rows, filters]);

  const set = (patch: Partial<InfirmaryFilters>) => {
    setLimit(PAGE_SIZE);
    onFiltersChange({ ...filters, ...patch });
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-bold transition ${
      active ? "border-[#443760] bg-[#443760] text-white" : "border-[#d9a9c9] bg-white/70 text-[#443760] hover:bg-white"
    }`;

  return (
    <section className="rounded-xl border border-[#d9a9c9]/60 bg-[linear-gradient(180deg,#F5DCEC_0%,#E8C4DC_100%)] p-4 shadow-md md:p-5">
      <h2 className="mb-3 text-center text-xl font-bold text-[#443760] md:text-2xl" style={serif}>
        Appointment Requests
      </h2>

      {/* Filters */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d5b7a]" />
          <input
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search student or service"
            className="w-full rounded-md border border-[#d9a9c9] bg-white/80 py-2 pl-9 pr-3 text-sm text-[#39265f] outline-none focus:border-[#6d5b7a]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => (
            <button key={s} type="button" onClick={() => set({ status: s })} className={chip(filters.status === s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => set({ category: "All" })} className={chip(filters.category === "All")}>
            All services
          </button>
          {(Object.keys(CATEGORY_LABELS) as AppointmentCategory[]).map((c) => (
            <button key={c} type="button" onClick={() => set({ category: c })} className={chip(filters.category === c)}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {warnings.map((w) => (
        <p key={w} role="alert" className="mb-2 rounded-md bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800">
          {w}
        </p>
      ))}

      {/* List: every row opens the appointment requests page */}
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-[#c897b9]/50" aria-busy="true" />
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-[#6d5b7a]" style={serif}>No requests match the current filters.</p>
      ) : (
        <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
          {filtered.slice(0, limit).map((r, i) => {
            const Icon = CATEGORY_ICONS[r.category] ?? PlusSquare;
            return (
              <Link
                key={r.id}
                href={INFIRMARY_REQUESTS_HREF}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition hover:brightness-95 ${
                  i % 2 === 0 ? "bg-[#C48AB2]" : "bg-[#DDB3D0]"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-inner">
                  <Icon size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1" style={serif}>
                  <p className="truncate text-sm font-bold text-[#39265f] md:text-base">{r.service}</p>
                  <p className="truncate text-xs text-[#39265f]/80">
                    {r.student_name} · {r.program_year_section}
                  </p>
                  <p className="truncate text-xs text-[#39265f]/80">
                    {fmtDate(r.preferred_date)} · {r.preferred_time}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
                <span className="hidden shrink-0 text-xs text-[#39265f] sm:inline" style={serif}>
                  {fmtDate(r.created_at)}
                </span>
                <ChevronRight size={18} className="shrink-0 text-[#39265f]" />
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="mx-auto mt-3 block rounded-full border border-[#6d5b7a] px-4 py-1 text-sm font-bold text-[#443760] transition hover:bg-white/60"
        >
          Show more ({filtered.length - limit} remaining)
        </button>
      )}

      <div className="mt-3 flex justify-center text-sm font-bold text-[#443760]" style={serif}>
        <Link href={INFIRMARY_REQUESTS_HREF} className="underline-offset-2 hover:underline">
          Open appointment requests →
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick actions (same layout as the registrar version)               */
/* ------------------------------------------------------------------ */

export function InfirmaryQuickActions({
  pending,
  refreshing,
  onReviewPending,
  onRefresh,
  announcementsHref,
}: {
  pending: number;
  refreshing: boolean;
  onReviewPending: () => void;
  onRefresh: () => void;
  announcementsHref: string;
}) {
  const row = "group flex w-full items-center gap-4 text-left transition hover:translate-x-1 disabled:opacity-60";
  const label = "flex flex-1 items-center justify-between border-b border-white/70 pb-1 text-base text-white group-hover:border-white";
  const badge = "ml-2 rounded-full bg-[#F8C8E2] px-2 text-xs font-bold text-[#443760]";

  return (
    <section className="rounded-xl border border-[#d9a9c9]/40 bg-[linear-gradient(135deg,#5E4D7C_0%,#4E3D6B_100%)] p-5 shadow-md lg:w-[320px] lg:shrink-0">
      <h2 className="mb-4 text-xl font-bold text-white md:text-2xl" style={serif}>Quick Actions</h2>
      <div className="flex flex-col gap-4" style={serif}>
        <button type="button" onClick={onReviewPending} className={row}>
          <Stethoscope size={34} strokeWidth={1.5} fill="#E7B7D6" stroke="#5E4D7C" className="shrink-0" />
          <span className={label}>Review pending requests <span className={badge}>{pending}</span></span>
        </button>
        <button type="button" onClick={onRefresh} disabled={refreshing} className={row}>
          <RefreshCw size={34} strokeWidth={1.5} className={`shrink-0 text-[#E7B7D6] ${refreshing ? "animate-spin" : ""}`} />
          <span className={label}>{refreshing ? "Refreshing…" : "Refresh requests"}</span>
        </button>
        <Link href={announcementsHref} className={row}>
          <Megaphone size={34} strokeWidth={1.5} fill="#E7B7D6" stroke="#5E4D7C" className="shrink-0" />
          <span className={label}>Post an announcement</span>
        </Link>
      </div>
    </section>
  );
}
