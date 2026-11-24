"use client";

import { useSearchQuery, matchesQuery } from "@/lib/useSearchQuery";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards";
import {
  PrintRequestModal,
  ProcessPrintModal,
  RejectPrintModal,
  PrintResultModal,
  type PaperSize,
  type PrintOutcome,
  type PrintStatus,
} from "@/components/admin/lsc/modals/PrintingModals";
import { fetchPrintRequests, decidePrintRequest, type PrintRequest } from "@/lib/adminlscApi";

type PaperTab = "ALL" | PaperSize;
type Stage = "details" | "process" | "reject" | "result";

const PAPER_TABS: PaperTab[] = ["ALL", "Letter", "A4", "Legal"];

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

export default function PrintingRequestsPage() {
  const q = useSearchQuery();
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [paperTab, setPaperTab] = useState<PaperTab>("ALL");
  const [selectedId, setSelectedId] = useState<PrintRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<PrintOutcome | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await fetchPrintRequests());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load print requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        const matchesSearch = matchesQuery(q, r.student_name, r.program_year_section, r.request_number);
        return matchesStatus && matchesPaper && matchesSearch;
      }),
    [requests, statusKey, paperTab, q]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = requests.find((r) => r.id === selectedId) ?? null;

  const openRequest = (id: PrintRequest["id"]) => {
    setError(null);
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  const decide = async (
    action: "process" | "reject",
    status: "Processed" | "Rejected",
    remarks: string,
    result: PrintOutcome
  ) => {
    if (!current) return;
    try {
      await decidePrintRequest(current.id, action, remarks);
      setRequests((prev) =>
        prev.map((r) => (r.id === current.id ? { ...r, status, remarks } : r))
      );
      setOutcome(result);
      setStage("result");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the decision.");
      setStage("details");
    }
  };

  // The "Notify student" checkbox does nothing: the database trigger always notifies the student.
  const handleProcess = (remarks: string, _notify: boolean) =>
    decide("process", "Processed", remarks, { status: "Processed", remarks });

  const handleReject = (reason: string, remarks: string, _notify: boolean) =>
    decide("reject", "Rejected", [reason, remarks].filter(Boolean).join(" — "), {
      status: "Rejected",
      reason,
      remarks,
    });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-6xl mx-auto">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-[#ff2d2d] px-4 py-2 text-sm font-bold text-white">
            {error}
          </p>
        )}

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