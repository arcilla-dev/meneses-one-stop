"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { Calendar, Clock, Printer, GraduationCap, RefreshCw, Megaphone, ChevronRight, Search } from "lucide-react";
import { Dela_Gothic_One, Great_Vibes } from "next/font/google";
import RequestStatCards, { type StatKey } from "@/components/admin/RequestStatCards";
import { createClient } from "@/utils/supabase/client";
import { OFFICES, MOCK, isOffice, type DashboardOffice } from "@/lib/adminDashboard";
import { RecentRequests, QuickActions, type Announcement } from "@/components/admin/DashboardPanels";
import { OfficeBottomRow, OfficeQuickActions, type QuickActionItem } from "@/components/admin/OfficeBottomRow";
import { useOfficeAnnouncements } from "@/lib/useOfficeAnnouncements";
import RegistrarSection from "@/components/admin//registrar/RegistrarSection";
import InfirmarySection from "@/components/admin/infirmary/InfirmarySection";
import { fetchPrintRequests, type PrintRequest } from "@/lib/adminlscApi"; // adjust the path if your lib folder differs
import { fetchApplications, type ScholarshipApplication } from "@/lib/adminscholarshipApi";

const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({ weight: "400", subsets: ["latin"] });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"] });

const pad = (n: number) => n.toString().padStart(2, "0");

const cardClass =
  "flex items-center gap-5 rounded-xl border-2 border-[#d9a9c9]/70 p-4 shadow-lg " +
  "bg-[linear-gradient(90deg,rgba(68,55,96,0.75)_0%,rgba(68,55,96,0.75)_50%,rgba(43,9,20,0.75)_100%)]";

const ANNOUNCEMENTS_MANAGE_HREF = "/adminv2/announcements"; // verify this route exists

/* ------------------------------------------------------------------ */
/*  LSC section (print requests)                                       */
/* ------------------------------------------------------------------ */

// Per your instructions. This is the scholarship route; if LSC has its own
// print-requests page, change it here and every row and link follows.
const LSC_REQUESTS_HREF = "/adminv2/scholarship/scholarship-applications";
const LSC_PAGE_SIZE = 8;

type LscStatus = PrintRequest["status"];
type LscFilter = "All" | LscStatus;

const LSC_FILTER_BY_KEY: Record<StatKey, LscFilter> = {
  total: "All",
  pending: "Pending",
  approved: "Processed",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-900 border-amber-300",
  Processed: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Approved: "bg-emerald-100 text-emerald-900 border-emerald-300",
  Rejected: "bg-rose-100 text-rose-900 border-rose-300",
};

const serif = { fontFamily: "Georgia, serif" } as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-bold transition ${
    active ? "border-[#443760] bg-[#443760] text-white" : "border-[#d9a9c9] bg-white/70 text-[#443760] hover:bg-white"
  }`;

/** Search box + status chips, same look as the registrar and infirmary lists. */
function FilterBar<T extends string>({
  query,
  onQuery,
  placeholder,
  statuses,
  status,
  onStatus,
}: {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  statuses: readonly T[];
  status: T;
  onStatus: (s: T) => void;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d5b7a]" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-[#d9a9c9] bg-white/80 py-2 pl-9 pr-3 text-sm text-[#39265f] outline-none focus:border-[#6d5b7a]"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} type="button" onClick={() => onStatus(s)} className={chipClass(status === s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function LscSection({
  announcements,
  announcementsError,
  manageHref,
  approvedLabel,
}: {
  announcements: Announcement[];
  announcementsError: string | null;
  manageHref: string;
  approvedLabel?: string;
}) {
  const [rows, setRows] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LscFilter>("All");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(LSC_PAGE_SIZE);
  const requestsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchPrintRequests()); // already newest first
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load print requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const count = (s: LscStatus) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      pending: count("Pending"),
      processed: count("Processed"),
      rejected: count("Rejected"),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "All" || r.status === filter) &&
        (!q ||
          r.student_name.toLowerCase().includes(q) ||
          r.request_number.toLowerCase().includes(q) ||
          (r.student_number ?? "").toLowerCase().includes(q))
    );
  }, [rows, filter, query]);

  const activeKey = (Object.keys(LSC_FILTER_BY_KEY) as StatKey[]).find((k) => LSC_FILTER_BY_KEY[k] === filter);

  const jumpTo = (next: LscFilter) => {
    setFilter(next);
    setQuery("");
    setLimit(LSC_PAGE_SIZE);
    requestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actions: QuickActionItem[] = [
    {
      key: "pending",
      label: "Review pending print requests",
      icon: Printer,
      badge: stats.pending,
      onClick: () => jumpTo("Pending"),
    },
    {
      key: "refresh",
      label: loading ? "Refreshing…" : "Refresh requests",
      icon: RefreshCw,
      filled: false,
      spin: loading,
      disabled: loading,
      onClick: refresh,
    },
    { key: "announce", label: "Post an announcement", icon: Megaphone, href: manageHref },
  ];

  return (
    <>
      <RequestStatCards
        total={stats.total}
        pending={stats.pending}
        approved={stats.processed}
        rejected={stats.rejected}
        labels={approvedLabel ? { approved: approvedLabel } : undefined}
        loading={loading}
        activeKey={activeKey}
        onSelect={(key) => jumpTo(key === activeKey ? "All" : LSC_FILTER_BY_KEY[key])}
      />

      <div ref={requestsRef} className="scroll-mt-4">
        <section className="rounded-xl border border-[#d9a9c9]/60 bg-[linear-gradient(180deg,#F5DCEC_0%,#E8C4DC_100%)] p-4 shadow-md md:p-5">
          <h2 className="mb-3 text-center text-xl font-bold text-[#443760] md:text-2xl" style={serif}>
            Recent Requests
          </h2>

          <FilterBar
            query={query}
            onQuery={(q) => {
              setQuery(q);
              setLimit(LSC_PAGE_SIZE);
            }}
            placeholder="Search student, student number or request no."
            statuses={["All", "Pending", "Processed", "Rejected"] as const}
            status={filter}
            onStatus={(s) => {
              setFilter(s);
              setLimit(LSC_PAGE_SIZE);
            }}
          />

          {error && (
            <p role="alert" className="mb-2 rounded-md bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </p>
          )}

          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-[#c897b9]/50" aria-busy="true" />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-[#6d5b7a]" style={serif}>
              {rows.length === 0 ? "No print requests yet." : "No requests match the current filters."}
            </p>
          ) : (
            <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
              {filtered.slice(0, limit).map((r, i) => (
                <Link
                  key={r.id}
                  href={LSC_REQUESTS_HREF}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition hover:brightness-95 ${
                    i % 2 === 0 ? "bg-[#C48AB2]" : "bg-[#DDB3D0]"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-inner">
                    <Printer size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1" style={serif}>
                    <p className="truncate text-sm font-bold text-[#39265f] md:text-base">
                      {r.request_number} · {r.student_name}
                    </p>
                    <p className="truncate text-xs text-[#39265f]/80">
                      {r.program_year_section || "—"} · {r.pages} pg · {r.paper_size} · {r.color}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {r.status}
                  </span>
                  <span className="hidden shrink-0 text-xs text-[#39265f] sm:inline" style={serif}>
                    {fmtDate(r.created_at)}
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-[#39265f]" />
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + LSC_PAGE_SIZE)}
              className="mx-auto mt-3 block rounded-full border border-[#6d5b7a] px-4 py-1 text-sm font-bold text-[#443760] transition hover:bg-white/60"
            >
              Show more ({filtered.length - limit} remaining)
            </button>
          )}

          <div className="mt-3 text-center text-sm font-bold text-[#443760]" style={serif}>
            <Link href={LSC_REQUESTS_HREF} className="underline-offset-2 hover:underline">
              View all requests →
            </Link>
          </div>
        </section>
      </div>

      <OfficeBottomRow
        announcements={announcements}
        announcementsError={announcementsError}
        manageHref={manageHref}
        right={<OfficeQuickActions actions={actions} />}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Scholarship section (applications)                                 */
/* ------------------------------------------------------------------ */

const SCHOLARSHIP_APPLICATIONS_HREF = "/adminv2/scholarship/scholarship-applications";
const SCHOLARSHIP_PAGE_SIZE = 8;

type SchStatus = ScholarshipApplication["status"];
type SchFilter = "All" | SchStatus;

const SCH_FILTER_BY_KEY: Record<StatKey, SchFilter> = {
  total: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function ScholarshipSection({
  announcements,
  announcementsError,
  manageHref,
  approvedLabel,
}: {
  announcements: Announcement[];
  announcementsError: string | null;
  manageHref: string;
  approvedLabel?: string;
}) {
  const [rows, setRows] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SchFilter>("All");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(SCHOLARSHIP_PAGE_SIZE);
  const requestsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchApplications()); // already newest first
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load scholarship applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const count = (s: SchStatus) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      pending: count("Pending"),
      approved: count("Approved"),
      rejected: count("Rejected"),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "All" || r.status === filter) &&
        (!q ||
          r.student_name.toLowerCase().includes(q) ||
          r.scholarship.toLowerCase().includes(q) ||
          r.application_id.toLowerCase().includes(q) ||
          (r.student_number ?? "").toLowerCase().includes(q))
    );
  }, [rows, filter, query]);

  const activeKey = (Object.keys(SCH_FILTER_BY_KEY) as StatKey[]).find((k) => SCH_FILTER_BY_KEY[k] === filter);

  const jumpTo = (next: SchFilter) => {
    setFilter(next);
    setQuery("");
    setLimit(SCHOLARSHIP_PAGE_SIZE);
    requestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actions: QuickActionItem[] = [
    {
      key: "pending",
      label: "Review pending applications",
      icon: GraduationCap,
      badge: stats.pending,
      onClick: () => jumpTo("Pending"),
    },
    {
      key: "refresh",
      label: loading ? "Refreshing…" : "Refresh applications",
      icon: RefreshCw,
      filled: false,
      spin: loading,
      disabled: loading,
      onClick: refresh,
    },
    { key: "announce", label: "Post an announcement", icon: Megaphone, href: manageHref },
  ];

  return (
    <>
      <RequestStatCards
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        labels={approvedLabel ? { approved: approvedLabel } : undefined}
        loading={loading}
        activeKey={activeKey}
        onSelect={(key) => jumpTo(key === activeKey ? "All" : SCH_FILTER_BY_KEY[key])}
      />

      <div ref={requestsRef} className="scroll-mt-4">
        <section className="rounded-xl border border-[#d9a9c9]/60 bg-[linear-gradient(180deg,#F5DCEC_0%,#E8C4DC_100%)] p-4 shadow-md md:p-5">
          <h2 className="mb-3 text-center text-xl font-bold text-[#443760] md:text-2xl" style={serif}>
            Recent Applications
          </h2>

          <FilterBar
            query={query}
            onQuery={(q) => {
              setQuery(q);
              setLimit(SCHOLARSHIP_PAGE_SIZE);
            }}
            placeholder="Search student, scholarship or application ID"
            statuses={["All", "Pending", "Approved", "Rejected"] as const}
            status={filter}
            onStatus={(s) => {
              setFilter(s);
              setLimit(SCHOLARSHIP_PAGE_SIZE);
            }}
          />

          {error && (
            <p role="alert" className="mb-2 rounded-md bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800">
              {error}
            </p>
          )}

          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-[#c897b9]/50" aria-busy="true" />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-[#6d5b7a]" style={serif}>
              {rows.length === 0 ? "No scholarship applications yet." : "No applications match the current filters."}
            </p>
          ) : (
            <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
              {filtered.slice(0, limit).map((r, i) => (
                <Link
                  key={r.id}
                  href={SCHOLARSHIP_APPLICATIONS_HREF}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition hover:brightness-95 ${
                    i % 2 === 0 ? "bg-[#C48AB2]" : "bg-[#DDB3D0]"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-inner">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1" style={serif}>
                    <p className="truncate text-sm font-bold text-[#39265f] md:text-base">
                      {r.scholarship} · {r.student_name}
                    </p>
                    <p className="truncate text-xs text-[#39265f]/80">
                      {r.application_id}
                      {r.program_year_section ? ` · ${r.program_year_section}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {r.status}
                  </span>
                  <span className="hidden shrink-0 text-xs text-[#39265f] sm:inline" style={serif}>
                    {fmtDate(r.created_at)}
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-[#39265f]" />
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + SCHOLARSHIP_PAGE_SIZE)}
              className="mx-auto mt-3 block rounded-full border border-[#6d5b7a] px-4 py-1 text-sm font-bold text-[#443760] transition hover:bg-white/60"
            >
              Show more ({filtered.length - limit} remaining)
            </button>
          )}

          <div className="mt-3 text-center text-sm font-bold text-[#443760]" style={serif}>
            <Link href={SCHOLARSHIP_APPLICATIONS_HREF} className="underline-offset-2 hover:underline">
              View all applications →
            </Link>
          </div>
        </section>
      </div>

      <OfficeBottomRow
        announcements={announcements}
        announcementsError={announcementsError}
        manageHref={manageHref}
        right={<OfficeQuickActions actions={actions} />}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [now, setNow] = useState<Date | null>(null);
  // undefined = still loading, null = no name on the profile
  const [adminName, setAdminName] = useState<string | null | undefined>(undefined);
  // undefined = still loading
  const [office, setOffice] = useState<DashboardOffice | undefined>(undefined);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Admin's own profile row: name + which office they run
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setAdminName(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, office")
        .eq("id", user.id)
        .maybeSingle();

      if (error) console.error(error.message);
      if (cancelled) return;

      setAdminName(data?.full_name?.trim() || null);

      const value = data?.office?.toString().trim().toLowerCase();
      if (isOffice(value)) {
        setOffice(value);
      } else {
        console.warn(`Unknown profiles.office "${data?.office}", falling back to registrar`);
        setOffice("registrar");
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // Shared by every office: latest announcements issued by this admin's office
  const { items: announcements, error: announcementsError } = useOfficeAnnouncements(office);

  const cfg = office ? OFFICES[office] : null;
  const data = office ? MOCK[office] : null;

  const dateText = now
    ? `${now.getFullYear()} - ${pad(now.getMonth() + 1)} - ${pad(now.getDate())}`
    : "202_ - __ - __";

  const hours24 = now?.getHours() ?? 0;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const timeText = now
    ? `${pad(hours12)} : ${pad(now.getMinutes())} : ${pad(now.getSeconds())} ${hours24 >= 12 ? "PM" : "AM"}`
    : "__ : __ : __ AM";

  const greeting = !now
    ? "GOOD MORNING"
    : hours24 < 12
      ? "GOOD MORNING"
      : hours24 < 18
        ? "GOOD AFTERNOON"
        : "GOOD EVENING";

  const greetingName =
    adminName === undefined
      ? "Loading..."
      : adminName
        ? adminName.split(/\s+/).slice(0, 2).join(" ")
        : (cfg?.fallbackName ?? "Admin");

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcdced]">
      {/* Top row: banner + date/time */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/greeting-bg.png")' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent mix-blend-multiply" />

          <div className="relative z-10 text-white text-left items-start w-full px-6 md:px-10 flex flex-col gap-2 drop-shadow-lg">
            <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-gray-200">
              Everything you need, in one place.
            </p>

            <h1 className={`${delaGothicOne.className} text-3xl md:text-5xl tracking-wide text-white mt-1`}>
              {greeting},{" "}
              <span className={`${greatVibes.className} font-normal capitalize ml-1 text-pink-100 text-[1.2em]`}>
                {greetingName}
                {adminName ? "!" : ""}
              </span>
            </h1>

            <p className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-gray-300 mt-2">
              Welcome back to your dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full xl:w-[320px] shrink-0">
          <div className={cardClass}>
            <Calendar className="h-16.5 w-14 shrink-0" fill="#F8C8E2" stroke="#6B4F72" strokeWidth={1} />
            <div className="flex flex-col text-left" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-white font-black text-[20px] tracking-wide uppercase drop-shadow-sm">Today&apos;s Date</span>
              <span className="text-white text-lg tracking-[0.12em] mt-1 tabular-nums drop-shadow-sm">{dateText}</span>
            </div>
          </div>

          <div className={cardClass}>
            <Clock className="h-16.5 w-14 shrink-0" fill="#F8C8E2" stroke="#6B4F72" strokeWidth={1} />
            <div className="flex flex-col text-left" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-white font-black text-[20px] tracking-wide uppercase drop-shadow-sm">Current Time</span>
              <span className="text-white text-lg tracking-[0.1em] mt-1 tabular-nums drop-shadow-sm">{timeText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Everything below depends on profiles.office. Only the requests section differs per office. */}
      {cfg && data && office ? (
        office === "registrar" ? (
          <RegistrarSection
            announcements={announcements}
            announcementsError={announcementsError}
            manageHref={ANNOUNCEMENTS_MANAGE_HREF}
            approvedLabel={cfg.approvedLabel}
          />
        ) : office === "infirmary" ? (
          <InfirmarySection
            announcements={announcements}
            announcementsError={announcementsError}
            manageHref={ANNOUNCEMENTS_MANAGE_HREF}
            approvedLabel={cfg.approvedLabel}
          />
        ) : office === "lsc" ? (
          <LscSection
            announcements={announcements}
            announcementsError={announcementsError}
            manageHref={ANNOUNCEMENTS_MANAGE_HREF}
            approvedLabel={cfg.approvedLabel}
          />
        ) : office === "scholarship" ? (
          <ScholarshipSection
            announcements={announcements}
            announcementsError={announcementsError}
            manageHref={ANNOUNCEMENTS_MANAGE_HREF}
            approvedLabel={cfg.approvedLabel}
          />
        ) : (
          // Any office that is not wired to live data: unchanged mock behavior
          <>
            <RequestStatCards
              total={data.stats[0]}
              pending={data.stats[1]}
              approved={data.stats[2]}
              rejected={data.stats[3]}
              labels={{ approved: cfg.approvedLabel }}
              breakdown={data.breakdown}
            />

            <RecentRequests columns={cfg.columns} rows={data.rows} href={cfg.requestsHref} />

            <OfficeBottomRow
              announcements={announcements}
              announcementsError={announcementsError}
              manageHref={ANNOUNCEMENTS_MANAGE_HREF}
              right={<QuickActions actions={cfg.quickActions} />}
            />
          </>
        )
      ) : (
        <div className="h-64 animate-pulse rounded-xl bg-[#c897b9]/50" aria-busy="true" aria-label="Loading dashboard" />
      )}
    </div>
  );
}
