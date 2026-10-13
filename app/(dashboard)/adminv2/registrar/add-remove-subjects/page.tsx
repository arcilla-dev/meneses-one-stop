"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import SubjectRequestModal from "@/components/admin/registrar/modals/SubjectRequestModal";
import {
  ApproveRequestModal,
  RejectRequestModal,
  DecisionResultModal,
  type DecisionOutcome,
} from "@/components/admin/registrar/modals/SubjectDecisionModals";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

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

type BaseRequest = Omit<
  SubjectRequest,
  "id" | "student_number" | "course_name" | "units" | "schedule" | "reason" | "current_units"
>;

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

// Hardcoded stand-ins for the modal details. With Supabase these would come from the request row
// (reason, student_number) and a subjects/enrollment table (course name, units, schedule, current load).
const COURSE_CATALOG: Record<string, { name: string; units: number; schedule: string }> = {
  "CPE 402": { name: "Computer Architecture and Organization", units: 3, schedule: "Tue & Wed  \u2022  01:00 PM - 04:00 PM" },
  "CPE 403": { name: "Embedded Systems", units: 3, schedule: "Mon & Thu  \u2022  08:00 AM - 11:00 AM" },
  "CPE 404": { name: "Computer Networks and Security", units: 3, schedule: "Wed & Fri  \u2022  09:00 AM - 12:00 PM" },
  "CPE 404d": { name: "CpE Elective", units: 3, schedule: "Sat  \u2022  08:00 AM - 11:00 AM" },
  "CPE 405": { name: "Digital Signal Processing", units: 3, schedule: "Tue & Thu  \u2022  02:00 PM - 05:00 PM" },
};

const REASONS: Record<SubjectRequestType, string> = {
  "Add Subject": "Needed to complete the required units for graduation.",
  "Remove Subject": "Schedule conflict with another required subject.",
};

// --- Mock data (stand-in for a Supabase table named "subject_requests") ---
// Expected real columns: id, request_type, course_code, student_name, program_year_section, created_at, status,
// plus (or joined): student_number, course_name, units, schedule, reason, current_units
// Mock totals match the wireframe: 38 total / 11 pending / 9 approved / 18 rejected.
const buildMockRequests = (): SubjectRequest[] => {
  const S = "BSCpE - 4B";
  // The 16 rows visible in the wireframe, newest first.
  const wireframeRows: BaseRequest[] = [
    { request_type: "Add Subject", course_code: "CPE 402", student_name: "Josh Nathaniel R. Arcilla", program_year_section: S, created_at: "2026-05-10T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 405", student_name: "Hazel Rose V. de Guzman", program_year_section: S, created_at: "2026-05-04T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 402", student_name: "Cloiez Veniz L. Belmonte", program_year_section: S, created_at: "2026-05-01T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 405", student_name: "Jerome S. Lagarde", program_year_section: S, created_at: "2026-04-26T00:00:00", status: "Pending" },
    { request_type: "Add Subject", course_code: "CPE 403", student_name: "Josh Nathaniel R. Arcilla", program_year_section: S, created_at: "2026-04-10T00:00:00", status: "Approved" },
    { request_type: "Add Subject", course_code: "CPE 404d", student_name: "Hazel Rose V. de Guzman", program_year_section: S, created_at: "2026-04-04T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 402", student_name: "Cloiez Veniz L. Belmonte", program_year_section: S, created_at: "2026-04-01T00:00:00", status: "Pending" },
    { request_type: "Add Subject", course_code: "CPE 405", student_name: "Jerome S. Lagarde", program_year_section: S, created_at: "2026-03-26T00:00:00", status: "Approved" },
    { request_type: "Remove Subject", course_code: "CPE 404d", student_name: "Josh Nathaniel R. Arcilla", program_year_section: S, created_at: "2026-03-10T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 405", student_name: "Hazel Rose V. de Guzman", program_year_section: S, created_at: "2026-03-04T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 403", student_name: "Cloiez Veniz L. Belmonte", program_year_section: S, created_at: "2026-03-01T00:00:00", status: "Rejected" },
    { request_type: "Add Subject", course_code: "CPE 404", student_name: "Jerome S. Lagarde", program_year_section: S, created_at: "2026-02-26T00:00:00", status: "Approved" },
    { request_type: "Add Subject", course_code: "CPE 402", student_name: "Josh Nathaniel R. Arcilla", program_year_section: S, created_at: "2026-02-10T00:00:00", status: "Pending" },
    { request_type: "Remove Subject", course_code: "CPE 405", student_name: "Hazel Rose V. de Guzman", program_year_section: S, created_at: "2026-02-04T00:00:00", status: "Rejected" },
    { request_type: "Add Subject", course_code: "CPE 404d", student_name: "Cloiez Veniz L. Belmonte", program_year_section: S, created_at: "2026-02-01T00:00:00", status: "Pending" },
    { request_type: "Add Subject", course_code: "CPE 405", student_name: "Jerome S. Lagarde", program_year_section: S, created_at: "2026-01-26T00:00:00", status: "Rejected" },
  ];

  // 22 older rows so the totals line up with the stat cards in the wireframe.
  const names = ["Josh Nathaniel R. Arcilla", "Hazel Rose V. de Guzman", "Cloiez Veniz L. Belmonte", "Jerome S. Lagarde"];
  const codes = ["CPE 402", "CPE 403", "CPE 404", "CPE 404d", "CPE 405"];
  const older: BaseRequest[] = Array.from({ length: 22 }, (_, i) => ({
    request_type: i % 2 === 0 ? "Add Subject" : "Remove Subject",
    course_code: codes[i % codes.length],
    student_name: names[i % names.length],
    program_year_section: S,
    created_at: `2026-01-${String(24 - i).padStart(2, "0")}T00:00:00`,
    status: i < 1 ? "Pending" : i < 7 ? "Approved" : "Rejected",
  }));

  return [...wireframeRows, ...older].map((row, i) => {
    const course = COURSE_CATALOG[row.course_code];
    return {
      ...row,
      id: i + 1,
      student_number: "202XXXXXXX",
      course_name: course.name,
      units: course.units,
      schedule: course.schedule,
      reason: REASONS[row.request_type],
      current_units: 18,
    };
  });
};

export default function AddRemoveSubjectsPage() {
  const [requests, setRequests] = useState<SubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [typeTab, setTypeTab] = useState<TypeTab>("All");
  const [selectedId, setSelectedId] = useState<SubjectRequest["id"] | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("subject_requests")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setRequests(data as SubjectRequest[]);
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

  const setStatus = (id: SubjectRequest["id"], status: "Approved" | "Rejected") =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const handleApprove = (remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Approved");
    setOutcome({ status: "Approved", remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("subject_requests").update({ status: "Approved", remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  const handleReject = (reason: string, remarks: string, notify: boolean) => {
    if (!current) return;
    setStatus(current.id, "Rejected");
    setOutcome({ status: "Rejected", reason, remarks });
    setStage("result");
    // TODO (Supabase): await supabase.from("subject_requests").update({ status: "Rejected", reason, remarks }).eq("id", current.id);
    // TODO (Supabase): if (notify) insert a row into "notifications" for the student.
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
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
