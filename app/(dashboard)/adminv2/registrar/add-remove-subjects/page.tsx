"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import SubjectRequestModal from "@/components/admin/RequestModal";
import {
  ApproveRequestModal,
  RejectRequestModal,
  DecisionResultModal,
  type DecisionOutcome,
} from "@/components/admin/DecisionModals";
import {
  approveSubjectRequest,
  fetchSubjectRequests,
  rejectSubjectRequest,
} from "@/lib/adminregistrarApi";

type RequestStatus = "Pending" | "Approved" | "Rejected";
type SubjectRequestType = "Add Subject" | "Remove Subject";
type TypeTab = "All" | SubjectRequestType;
type Stage = "details" | "approve" | "reject" | "result";

const TYPE_TABS: TypeTab[] = ["All", "Add Subject", "Remove Subject"];

interface SubjectRequest {
  id: number | string;
  request_type: SubjectRequestType;
  course_code: string; // e.g. "CPE 402"
  student_name: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string; // ISO timestamp
  status: RequestStatus;
  // Details shown in the request modal
  student_number: string;
  course_name: string;
  units: number; // units of the subject being added / removed
  schedule: string;
  reason: string;
  current_units: number; // student's current load
}

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "Add / Remove Subjects",
  pending: "Pending Subject Requests",
  approved: "Approved Subject Requests",
  rejected: "Rejected Subject Requests",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const TABLE_HEADERS = ["Request Type", "Course Code", "Student Name", "Program/Yr/Sec", "Date", "Status"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

export default function AddRemoveSubjectsPage() {
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [typeTab, setTypeTab] = useState<TypeTab>("All");
  const [selectedId, setSelectedId] = useState<SubjectRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  const reload = useCallback(async () => {
    try {
      setRequests((await fetchSubjectRequests()) as SubjectRequest[]);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load requests.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const matchesStatus = statusKey === "total" || r.status.toLowerCase() === statusKey;
        const matchesType = typeTab === "All" || r.request_type === typeTab;
        return matchesStatus && matchesType;
      }),
    [requests, statusKey, typeTab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = requests.find((r) => r.id === selectedId) ?? null;

  const openRequest = (id: SubjectRequest["id"]) => {
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  // The database creates the student's notification whenever the status changes,
  // so the "notify student" checkbox no longer controls anything (see notes).
  const handleApprove = async (remarks: string, _notify: boolean) => {
    if (!current) return;
    try {
      await approveSubjectRequest(String(current.id), remarks); // also updates the student's subjects
      await reload();
      setActionError("");
      setOutcome({ status: "Approved", remarks });
      setStage("result");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not approve the request.");
    }
  };

  const handleReject = async (reason: string, remarks: string, _notify: boolean) => {
    if (!current) return;
    try {
      await rejectSubjectRequest(String(current.id), reason, remarks);
      await reload();
      setActionError("");
      setOutcome({ status: "Rejected", reason, remarks });
      setStage("result");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not reject the request.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      {/* Sits above the modals so a failed action is always visible */}
      {actionError && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 shadow-lg"
        >
          {actionError}
          <button type="button" onClick={() => setActionError("")} aria-label="Dismiss" className="font-bold">
            ×
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Stat cards double as the status filter */}
        <RequestStatCards
          {...counts}
          loading={loading}
          activeKey={statusKey}
          onSelect={setStatusKey}
        />

        {/* Request type tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={typeTab === tab}
                onClick={() => setTypeTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold uppercase shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  typeTab === tab ? TAB_ACTIVE : TAB_INACTIVE
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
          ) : loadError ? (
            <p role="alert" className="text-center font-semibold text-red-800 py-8">{loadError}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No requests found for this filter.</p>
          ) : (
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
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
                      <td className="px-3 py-2">{row.request_type}</td>
                      <td className="px-3 py-2 text-center">{row.course_code}</td>
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

      {current && stage === "details" && (
        <SubjectRequestModal
          request={current}
          onClose={closeAll}
          onApprove={() => setStage("approve")}
          onReject={() => setStage("reject")}
        />
      )}
      {current && stage === "approve" && (
        <ApproveRequestModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleApprove}
        />
      )}
      {current && stage === "reject" && (
        <RejectRequestModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {current && stage === "result" && outcome && (
        <DecisionResultModal
          request={current}
          outcome={outcome}
          onViewRequest={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}