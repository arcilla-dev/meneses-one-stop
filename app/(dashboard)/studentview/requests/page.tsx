"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileSignature,
  PlusSquare,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
const delaGothicOne = Dela_Gothic_One({ weight: "400", subsets: ["latin"] });

/* Same routes as the student sidebar's Offices submenu. */
const OFFICES: { label: string; href: string }[] = [
  { label: "Registrar", href: "/studentview/offices/registrar" },
  { label: "Infirmary", href: "/studentview/offices/infirmary" },
  { label: "Scholarship", href: "/studentview/offices/scholarship" },
  { label: "Local Student Council", href: "/studentview/offices/localstudentcouncil" },
];

type RequestStatus = "Pending" | "Approved" | "Rejected";
type TabOption = "All" | RequestStatus;
type OfficeName = "Registrar" | "Infirmary" | "LSC" | "Scholarship";

interface RequestItem {
  id: string;
  title: string;
  office: OfficeName;
  created_at: string; // ISO
  status: RequestStatus; // used for the tabs and badge colour
  rawStatus: string; // what the office actually set, e.g. "ready", "printing"
  request_type: string; // picks the icon
  reference?: string; // request number / application id
  extra?: string; // e.g. appointment date and time
  note?: string; // the office's remarks
}

const ICON_MAP: Record<string, React.ElementType> = {
  certificate: FileSignature,
  medical: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
  subject: BookOpen,
};
const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#956084] text-white",
  Pending: "bg-[#fce554] text-[#39265f]",
  Approved: "bg-[#67d953] text-[#39265f]",
  Rejected: "bg-[#f53c3d] text-white",
};

/* ---- each office has its own statuses; fold them into the three tabs ---- */
const REGISTRAR_STATUS: Record<string, RequestStatus> = {
  pending: "Pending",
  processing: "Pending",
  approved: "Approved",
  ready: "Approved",
  rejected: "Rejected",
};
const APPOINTMENT_STATUS: Record<string, RequestStatus> = {
  pending: "Pending",
  approved: "Approved",
  completed: "Approved",
  rejected: "Rejected",
  cancelled: "Rejected",
};
const PRINT_STATUS: Record<string, RequestStatus> = {
  pending: "Pending",
  printing: "Pending",
  ready: "Approved",
  claimed: "Approved",
  rejected: "Rejected",
  cancelled: "Rejected",
};
const SIMPLE_STATUS: Record<string, RequestStatus> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const formatTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

/* ---- data layer: one query per office, merged into one list ---- */
async function fetchAllRequests(): Promise<{ items: RequestItem[]; failed: string[] }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const uid = user.id;

  const [registrar, subjects, appts, prints, apps] = await Promise.all([
    supabase
      .from("registrar_requests")
      .select("id, request_type, status, remarks, created_at")
      .eq("user_id", uid),
    supabase
      .from("subject_changes")
      .select("id, kind, subject_code, subject_title, status, remarks, created_at")
      .eq("user_id", uid),
    supabase
      .from("appointments")
      .select("id, service, date, time_start, time_end, status, admin_remarks, created_at")
      .eq("user_id", uid),
    supabase
      .from("print_requests")
      .select("id, request_number, status, remarks, created_at")
      .eq("user_id", uid),
    supabase
      .from("applications")
      .select("id, application_id, status, remarks, created_at, scholarships(name)")
      .eq("user_id", uid),
  ]);

  const failed: string[] = [];
  const items: RequestItem[] = [];

  if (registrar.error) failed.push("Registrar");
  for (const r of registrar.data ?? []) {
    items.push({
      id: `reg-${r.id}`,
      title: titleCase(r.request_type),
      office: "Registrar",
      created_at: r.created_at,
      status: REGISTRAR_STATUS[r.status] ?? "Pending",
      rawStatus: r.status,
      request_type: "certificate",
      note: r.remarks ?? undefined,
    });
  }

  if (subjects.error && !failed.includes("Registrar")) failed.push("Registrar");
  for (const s of subjects.data ?? []) {
    items.push({
      id: `sub-${s.id}`,
      title: `${s.kind === "add" ? "Add" : "Remove"} Subject: ${s.subject_code}`,
      office: "Registrar",
      created_at: s.created_at,
      status: SIMPLE_STATUS[s.status] ?? "Pending",
      rawStatus: s.status,
      request_type: "subject",
      extra: s.subject_title,
      note: s.remarks ?? undefined,
    });
  }

  if (appts.error) failed.push("Infirmary");
  for (const a of appts.data ?? []) {
    items.push({
      id: `apt-${a.id}`,
      title: a.service,
      office: "Infirmary",
      created_at: a.created_at,
      status: APPOINTMENT_STATUS[a.status] ?? "Pending",
      rawStatus: a.status,
      request_type: "medical",
      extra: `${formatDate(a.date)}, ${formatTime(a.time_start)} - ${formatTime(a.time_end)}`,
      note: a.admin_remarks ?? undefined,
    });
  }

  if (prints.error) failed.push("LSC");
  for (const p of prints.data ?? []) {
    items.push({
      id: `prt-${p.id}`,
      title: "Printing Services",
      office: "LSC",
      created_at: p.created_at,
      status: PRINT_STATUS[p.status] ?? "Pending",
      rawStatus: p.status,
      request_type: "printing",
      reference: p.request_number ?? undefined,
      note: p.remarks ?? undefined,
    });
  }

  if (apps.error) failed.push("Scholarship");
  for (const a of (apps.data ?? []) as unknown as Array<{
    id: string;
    application_id: string;
    status: string;
    remarks: string | null;
    created_at: string;
    scholarships: { name: string } | { name: string }[] | null;
  }>) {
    const sch = Array.isArray(a.scholarships) ? a.scholarships[0] : a.scholarships;
    items.push({
      id: `app-${a.id}`,
      title: sch?.name ? `${sch.name} Application` : "Scholarship Application",
      office: "Scholarship",
      created_at: a.created_at,
      status: SIMPLE_STATUS[a.status] ?? "Pending",
      rawStatus: a.status,
      request_type: "scholarship",
      reference: a.application_id,
      note: a.remarks || undefined,
    });
  }

  items.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
  return { items, failed };
}

export default function MyRequestsMain() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabOption>("All");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { items, failed } = await fetchAllRequests();
        if (!active) return;
        setRequests(items);
        if (failed.length > 0) {
          setError(`Could not load requests from: ${failed.join(", ")}.`);
        }
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load your requests. Refresh the page to try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      All: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests =
    activeTab === "All" ? requests : requests.filter((item) => item.status === activeTab);

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Faded campus logo background */}
      <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 h-0">
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/request-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-[#39265f] md:gap-4">
            <Image
              src="/icons/request-icon.png"
              alt="Requests"
              width={45}
              height={45}
              className="h-13 w-13 object-contain sm:h-14 sm:w-14"
            />
            <div>
              <h1
                className={`${delaGothicOne.className} text-2xl tracking-wide sm:text-3xl md:text-4xl xl:text-5xl`}
              >
                My Requests
              </h1>
              <p
                className="mt-1 text-xs tracking-wide text-[#6d5b7a] sm:text-sm md:tracking-widest"
                style={{ fontFamily: "Georgia, serif" }}
              >
                View and track your service requests
              </p>
            </div>
          </div>

          {/* New Request: pick an office, go to its form */}
          <div className="relative self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#39265f]/30 bg-[#956084] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#80506f] active:scale-95"
            >
              <Plus size={20} strokeWidth={3} />
              New Request
            </button>
            {menuOpen && (
              <ul className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#c48ab2] bg-white shadow-lg">
                {OFFICES.map((o) => (
                  <li key={o.label}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(o.href);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-[#39265f] hover:bg-[#f4e1eb]"
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-5 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
          <div className="mx-3 flex gap-1 text-[#39265f] md:mx-4">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Status filters */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-8 md:gap-4">
          {(["All", "Pending", "Approved", "Rejected"] as TabOption[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`${delaGothicOne.className} rounded-xl px-3 py-3 text-xs shadow-sm transition hover:brightness-105 active:scale-95 sm:text-sm md:py-4 ${
                TAB_COLORS[tab]
              } ${
                activeTab === tab
                  ? "ring-2 ring-[#39265f]/40 ring-offset-2 ring-offset-[#ffd9e8]"
                  : "opacity-90"
              }`}
            >
              {tab}
              <span className="ml-2 font-sans text-xs">{counts[tab]}</span>
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-center text-sm text-[#671410]">{error}</p>}

        {/* Request list */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-10 text-center shadow-sm">
            <FileText size={40} className="mx-auto mb-3 text-[#956084]" strokeWidth={1.5} />
            <p className="text-lg font-bold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
              No {activeTab !== "All" ? activeTab.toLowerCase() : ""} requests yet.
            </p>
            <p className="mt-1 text-sm text-[#6d5b7a]">Your requests will appear here when you submit them.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8 md:gap-4">
            {filteredRequests.map((item) => {
              const Icon = getIconForType(item.request_type);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#c48ab2] bg-gradient-to-r from-[#dfb5d1]/90 via-[#d4a9c8]/85 to-[#a991b8]/85 p-3 text-left shadow-sm transition duration-200 hover:border-[#956084] hover:shadow-md active:scale-[0.99] sm:p-4 md:gap-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#b477a1] to-[#6d5b7a] shadow-inner sm:h-14 sm:w-14">
                      <Icon size={25} strokeWidth={1.8} className="text-white sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <h3
                        className="mb-0.5 break-words text-base font-bold text-[#39265f] sm:text-lg md:text-xl"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs font-medium text-[#5a4a75] sm:text-sm">
                        {item.office}
                        {item.reference ? ` • ${item.reference}` : ""}
                      </p>
                      <p className="text-xs text-[#5a4a75] sm:text-sm">{formatDate(item.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-5">
                    <span
                      className={`${TAB_COLORS[item.status]} min-w-[76px] rounded-full px-2 py-1 text-center text-[10px] font-bold shadow-sm sm:min-w-[100px] sm:px-4 sm:py-1.5 sm:text-xs`}
                    >
                      {item.status}
                    </span>
                    <ChevronRight size={24} strokeWidth={2.5} className="shrink-0 text-[#6d5b7a] sm:h-7 sm:w-7" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[#c48ab2] bg-[#fff5f9] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
                {selected.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-lg p-1 text-[#6d5b7a] hover:bg-[#f4e1eb]"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="mt-4 space-y-2 text-sm text-[#39265f]">
              <Row label="Office" value={selected.office} />
              {selected.reference && <Row label="Reference" value={selected.reference} />}
              {selected.extra && <Row label="Details" value={selected.extra} />}
              <Row label="Submitted" value={formatDate(selected.created_at)} />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold">Status</dt>
                <dd className="flex items-center gap-2">
                  <span className={`${TAB_COLORS[selected.status]} rounded-full px-3 py-1 text-xs font-bold`}>
                    {selected.status}
                  </span>
                  <span className="text-xs text-[#5a4a75]">({titleCase(selected.rawStatus)})</span>
                </dd>
              </div>
              {selected.note && (
                <div>
                  <dt className="font-bold">Note from {selected.office}</dt>
                  <dd className="mt-1 rounded-lg bg-white/70 p-3 text-[#5a4a75]">{selected.note}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-bold">{label}</dt>
      <dd className="text-right text-[#5a4a75]">{value}</dd>
    </div>
  );
}