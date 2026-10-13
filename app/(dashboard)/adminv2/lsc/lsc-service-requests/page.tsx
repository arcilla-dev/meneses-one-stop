"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards";
import {
  PrintRequestModal,
  ProcessPrintModal,
  RejectPrintModal,
  PrintResultModal,
  type PaperSize,
  type PrintColor,
  type PrintOutcome,
  type PrintRequestDetails,
  type PrintStatus,
} from "@/components/admin/lsc/modals/PrintingModals";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type PaperTab = "ALL" | PaperSize;
type Stage = "details" | "process" | "reject" | "result";

const PAPER_TABS: PaperTab[] = ["ALL", "Letter", "A4", "Legal"];

interface PrintRequest extends PrintRequestDetails {
  created_at: string; // ISO timestamp the request was submitted (used for ordering)
}

// RequestStatCards keys are fixed (total/pending/approved/rejected). Printing calls "approved" Processed.
const STATUS_BY_KEY: Record<Exclude<StatKey, "total">, PrintStatus> = {
  pending: "Pending",
  approved: "Processed",
  rejected: "Rejected",
};

const CARD_LABELS: Partial<Record<StatKey, string>> = { approved: "Processed" };

const SECTION_TITLES: Record<StatKey, string> = {
  total: "Printing Request",
  pending: "Pending Requests",
  approved: "Processed Requests",
  rejected: "Rejected Requests",
};

const STATUS_STYLES: Record<PrintStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Processed: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

// "Type" spans two columns (paper size + color), matching the wireframe.
const TABLE_HEADERS: Array<{ label: string; colSpan?: number }> = [
  { label: "Type", colSpan: 2 },
  { label: "Pages" },
  { label: "Student Name" },
  { label: "Course/Yr/Sec" },
  { label: "Status" },
];

// Pricing stand-in. Colored = 7/page is derived from the wireframe (3 pages = 21.00); B&W = 2/page is a guess.
// With Supabase, `total` should be stored on the row (or computed server-side), not recomputed here.
const RATE_PER_PAGE: Record<PrintColor, number> = { Colored: 7, "B&W": 2 };

// --- Mock data (stand-in for a Supabase table named "print_requests") ---
// Expected real columns: id, status, student_name, student_number, program_year_section, paper_size, color,
// layout, pages, additional_request, attachments, total, created_at
// Mock totals match the wireframe: 69 total / 15 pending / 45 processed / 9 rejected.
interface Preset {
  paper: PaperSize;
  color: PrintColor;
  pages: number;
  student: string;
}

const PRESETS: Preset[] = [
  { paper: "A4", color: "Colored", pages: 35, student: "Josh Nathaniel R. Arcilla" },
  { paper: "Legal", color: "B&W", pages: 2, student: "Hazel Rose V. de Guzman" },
  { paper: "Legal", color: "Colored", pages: 18, student: "Cloiez Veniz L. Belmonte" },
  { paper: "Letter", color: "B&W", pages: 3, student: "Jerome S. Lagarde" },
  { paper: "A4", color: "B&W", pages: 40, student: "Jerome S. Lagarde" },
];

// The 16 rows visible in the wireframe: [preset index, status].
const WIREFRAME_ROWS: Array<[number, PrintStatus]> = [
  [0, "Pending"],
  [1, "Pending"],
  [2, "Pending"],
  [3, "Pending"],
  [0, "Processed"],
  [1, "Pending"],
  [2, "Pending"],
  [0, "Processed"],
  [1, "Pending"],
  [2, "Pending"],
  [3, "Rejected"],
  [0, "Processed"],
  [1, "Pending"],
  [2, "Rejected"],
  [3, "Pending"],
  [4, "Rejected"],
];

const buildMockRequests = (): PrintRequest[] => {
  // 53 older rows so the totals line up with the stat cards: 5 pending, 42 processed, 6 rejected.
  const older: Array<[number, PrintStatus]> = Array.from({ length: 53 }, (_, i) => [
    i % PRESETS.length,
    i < 5 ? "Pending" : i < 47 ? "Processed" : "Rejected",
  ]);

  return [...WIREFRAME_ROWS, ...older].map(([presetIndex, status], i) => {
    const p = PRESETS[presetIndex];
    return {
      id: i + 1,
      status,
      student_name: p.student,
      student_number: "202XXXXXXX",
      program_year_section: "BSCpE - 4B",
      paper_size: p.paper,
      color: p.color,
      layout: i % 2 === 0 ? "Portrait" : "Landscape",
      pages: p.pages,
      additional_request: "",
      attachments: [{ name: "FileName.pdf", url: "#" }],
      total: p.pages * RATE_PER_PAGE[p.color],
      created_at: new Date(2026, 4, 10 - i).toISOString(),
    };
  });
};

export default function PrintingRequestsPage() {
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [paperTab, setPaperTab] = useState<PaperTab>("ALL");
  const [selectedId, setSelectedId] = useState<PrintRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<PrintOutcome | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("print_requests")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setRequests(data as PrintRequest[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setRequests(buildMockRequests());

      setLoading(false);
    };

    loadRequests();
  }, []);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Processed").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        // Not r.status.toLowerCase() === statusKey: "Processed" would never match the "approved" key.
        const matchesStatus = statusKey === "total" || r.status === STATUS_BY_KEY[statusKey];
        const matchesPaper = paperTab === "ALL" || r.paper_size === paperTab;
        return matchesStatus && matchesPaper;
      }),
    [requests, statusKey, paperTab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = requests.find((r) => r.id === selectedId) ?? null;

  const openRequest = (id: PrintRequest["id"]) => {
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  const setStatus = (id: PrintRequest["id"], status: "Processed" | "Rejected") =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const handleProcess = (remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Processed");
    setOutcome({ status: "Processed", remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("print_requests").update({ status: "Processed", remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  const handleReject = (reason: string, remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Rejected");
    setOutcome({ status: "Rejected", reason, remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("print_requests").update({ status: "Rejected", reason, remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-6xl mx-auto">
        {/* Stat cards double as the status filter */}
        <RequestStatCards
          {...counts}
          labels={CARD_LABELS}
          loading={loading}
          activeKey={statusKey}
          onSelect={setStatusKey}
        />

        {/* Paper size tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {PAPER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={paperTab === tab}
                onClick={() => setPaperTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  paperTab === tab ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
        </div>

        {/* Table panel */}
        <section className="rounded-xl bg-[#d8abca] p-4 md:p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <h2
            className="inline-block mb-4 px-6 py-2 rounded-lg bg-[#b07aa1] text-white text-lg font-bold uppercase tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {SECTION_TITLES[statusKey]}
          </h2>

          {loading ? (
            <p className="text-center text-[#5a4a75] py-8">Loading requests...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No requests found for this filter.</p>
          ) : (
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h.label}
                        colSpan={h.colSpan}
                        className="bg-[#b07aa1] text-white font-bold px-3 py-2 text-center"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => openRequest(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openRequest(row.id);
                        }
                      }}
                      className="cursor-pointer bg-[#f4e1eb] hover:bg-[#efd2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                    >
                      <td className="px-3 py-2 text-center">{row.paper_size}</td>
                      <td className="px-3 py-2 text-center">{row.color}</td>
                      <td className="px-3 py-2 text-center">{row.pages}</td>
                      <td className="px-3 py-2">{row.student_name}</td>
                      <td className="px-3 py-2 text-center">{row.program_year_section}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block min-w-[84px] px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {current && stage === "details" && (
        <PrintRequestModal
          request={current}
          onClose={closeAll}
          onProcess={() => setStage("process")}
          onReject={() => setStage("reject")}
        />
      )}
      {current && stage === "process" && (
        <ProcessPrintModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleProcess}
        />
      )}
      {current && stage === "reject" && (
        <RejectPrintModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {current && stage === "result" && outcome && (
        <PrintResultModal
          request={current}
          outcome={outcome}
          onViewRequest={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}
