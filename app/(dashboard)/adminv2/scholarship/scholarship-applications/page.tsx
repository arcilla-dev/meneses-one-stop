"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import {
  ScholarshipApplicationModal,
  ApproveApplicationModal,
  RejectApplicationModal,
  ApplicationResultModal,
} from "@/components/admin/scholarship/modals/ScholarshipModals";
import type { DecisionOutcome } from "@/components/admin/DecisionModals";
import {
  fetchApplications,
  decideApplication,
  type ApplicationStatus,
  type ScholarshipApplication,
} from "@/lib/adminscholarshipApi";

type Stage = "details" | "approve" | "reject" | "result";

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "Scholarship Applications",
  pending: "Pending Applications",
  approved: "Approved Applications",
  rejected: "Rejected Applications",
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const TABLE_HEADERS = ["Scholarship", "Student Name", "Program/Yr/Sec", "Date", "Status"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

export default function ScholarshipApplicationsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [tab, setTab] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<ScholarshipApplication["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await fetchApplications());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tabs come from the scholarships that actually have applications.
  const tabs = useMemo(
    () => ["ALL", ...Array.from(new Set(applications.map((a) => a.scholarship)))],
    [applications]
  );

  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "Pending").length,
      approved: applications.filter((a) => a.status === "Approved").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    }),
    [applications]
  );

  const filteredApplications = useMemo(
    () =>
      applications.filter((a) => {
        const matchesStatus = statusKey === "total" || a.status.toLowerCase() === statusKey;
        const matchesTab = tab === "ALL" || a.scholarship === tab;
        return matchesStatus && matchesTab;
      }),
    [applications, statusKey, tab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = applications.find((a) => a.id === selectedId) ?? null;
  const modalRequest = current ? { ...current, application_date: current.created_at } : null;

  const openApplication = (id: ScholarshipApplication["id"]) => {
    setError(null);
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  const decide = async (status: "Approved" | "Rejected", remarks: string, result: DecisionOutcome) => {
    if (!current) return;
    try {
      await decideApplication(current.id, status, remarks);
      setApplications((prev) =>
        prev.map((a) => (a.id === current.id ? { ...a, status, remarks } : a))
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
  const handleApprove = (remarks: string, _notify: boolean) =>
    decide("Approved", remarks, { status: "Approved", remarks });

  const handleReject = (reason: string, remarks: string, _notify: boolean) =>
    decide("Rejected", [reason, remarks].filter(Boolean).join(" — "), {
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
          loading={loading}
          activeKey={statusKey}
          onSelect={setStatusKey}
        />

        {/* Scholarship tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  tab === t ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {t}
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
            <p className="text-center text-[#5a4a75] py-8">Loading applications...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No applications found for this filter.</p>
          ) : (
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h}
                        className="bg-[#b07aa1] text-white font-bold px-3 py-2 text-center"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => openApplication(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openApplication(row.id);
                        }
                      }}
                      className="cursor-pointer bg-[#f4e1eb] hover:bg-[#efd2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                    >
                      <td className="px-3 py-2">{row.scholarship}</td>
                      <td className="px-3 py-2">{row.student_name}</td>
                      <td className="px-3 py-2 text-center">{row.program_year_section}</td>
                      <td className="px-3 py-2 text-center">{formatDate(row.created_at)}</td>
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

      {modalRequest && stage === "details" && (
        <ScholarshipApplicationModal
          request={modalRequest}
          onClose={closeAll}
          onApprove={() => setStage("approve")}
          onReject={() => setStage("reject")}
        />
      )}
      {modalRequest && stage === "approve" && (
        <ApproveApplicationModal
          request={modalRequest}
          onCancel={() => setStage("details")}
          onConfirm={handleApprove}
        />
      )}
      {modalRequest && stage === "reject" && (
        <RejectApplicationModal
          request={modalRequest}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {modalRequest && stage === "result" && outcome && (
        <ApplicationResultModal
          request={modalRequest}
          outcome={outcome}
          onViewApplication={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}