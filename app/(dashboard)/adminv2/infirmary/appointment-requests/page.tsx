"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import {
  AppointmentRequestModal,
  ApproveAppointmentModal,
  RejectAppointmentModal,
  AppointmentResultModal,
} from "@/components/admin/infirmary/modals/AppointmentModals";
import type { DecisionOutcome } from "@/components/admin/DecisionModals";
import {
  approveAppointmentRequest,
  fetchAppointmentRequests,
  rejectAppointmentRequest,
} from "@/lib/admininfirmaryApi";

type RequestStatus = "Pending" | "Approved" | "Rejected";
type ServiceCategory = "MedConsult" | "VSC" | "Dental" | "MedCert" | "Other";
type CategoryTab = "ALL" | ServiceCategory;
type Stage = "details" | "approve" | "reject" | "result";

const CATEGORY_TABS: CategoryTab[] = ["ALL", "MedConsult", "VSC", "Dental", "MedCert", "Other"];

interface AppointmentRequest {
  id: number | string;
  service: string; // full label shown in the table
  category: ServiceCategory; // drives the filter tabs
  student_name: string;
  student_number: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string; // ISO timestamp the request was submitted
  status: RequestStatus;
  // Details shown in the request modal
  preferred_date: string; // ISO timestamp
  preferred_time: string; // e.g. "01:00 PM - 02:00 PM"
  reason: string; // student's reason/remarks
}

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "Appointment Requests",
  pending: "Pending Requests",
  approved: "Approved Requests",
  rejected: "Rejected Requests",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const TABLE_HEADERS = ["Service", "Student Name", "Program/Yr/Sec", "Date", "Status"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

export default function AppointmentRequestsPage() {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("ALL");
  const [selectedId, setSelectedId] = useState<AppointmentRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  const reload = useCallback(async () => {
    try {
      setRequests((await fetchAppointmentRequests()) as AppointmentRequest[]);
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
        const matchesCategory = categoryTab === "ALL" || r.category === categoryTab;
        return matchesStatus && matchesCategory;
      }),
    [requests, statusKey, categoryTab]
  );

  // Always read the live row so the modals reflect the latest status after a decision.
  const current = requests.find((r) => r.id === selectedId) ?? null;

  const openRequest = (id: AppointmentRequest["id"]) => {
    setSelectedId(id);
    setStage("details");
  };

  const closeAll = () => {
    setStage(null);
    setSelectedId(null);
    setOutcome(null);
  };

  // The database creates the student's notification when the status changes,
  // so the "notify student" checkbox no longer controls anything.
  const handleApprove = async (remarks: string, _notify: boolean) => {
    if (!current) return;
    try {
      await approveAppointmentRequest(String(current.id), remarks);
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
      await rejectAppointmentRequest(String(current.id), reason, remarks);
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

        {/* Service category tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={categoryTab === tab}
                onClick={() => setCategoryTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  categoryTab === tab ? TAB_ACTIVE : TAB_INACTIVE
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
                      <td className="px-3 py-2">{row.service}</td>
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
        <AppointmentRequestModal
          request={current}
          onClose={closeAll}
          onApprove={() => setStage("approve")}
          onReject={() => setStage("reject")}
        />
      )}
      {current && stage === "approve" && (
        <ApproveAppointmentModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleApprove}
        />
      )}
      {current && stage === "reject" && (
        <RejectAppointmentModal
          request={current}
          onCancel={() => setStage("details")}
          onConfirm={handleReject}
        />
      )}
      {current && stage === "result" && outcome && (
        <AppointmentResultModal
          request={current}
          outcome={outcome}
          onViewRequest={() => setStage("details")}
          onDone={closeAll}
        />
      )}
    </div>
  );
}